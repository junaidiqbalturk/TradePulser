<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\User;
use App\Notifications\AccountActivityNotification;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;

class ShipmentController extends Controller
{
    public function index()
    {
        $shipments = Shipment::with(['importOrder.client', 'exportOrder.client'])->latest()->get();
        // Transform the response to include the correct client name depending on the type
        $shipments->transform(function ($shipment) {
            $shipment->client_name = $shipment->type === 'import' && $shipment->importOrder 
                ? $shipment->importOrder->client->company_name 
                : ($shipment->type === 'export' && $shipment->exportOrder 
                    ? $shipment->exportOrder->client->company_name 
                    : 'Unknown');
            return $shipment;
        });
        return response()->json($shipments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:import,export',
            'order_id' => 'required|integer',
            'origin_port' => 'required|string',
            'destination_port' => 'required|string',
            'vessel_name' => 'required|string',
            'shipping_line' => 'required|string',
            'etd' => 'required|date',
            'eta' => 'required|date',
            'status' => 'required|string',
            'containers' => 'nullable|array',
            'containers.*.container_number' => 'required|string',
            'containers.*.container_type' => 'nullable|string',
            'containers.*.seal_number' => 'nullable|string'
        ]);

        $shipmentNumber = 'SHP-' . strtoupper(Str::random(6)) . '-' . mt_rand(1000, 9999);

        $shipment = Shipment::create([
            'shipment_number' => $shipmentNumber,
            'type' => $request->type,
            'order_id' => $request->order_id,
            'origin_port' => $request->origin_port,
            'destination_port' => $request->destination_port,
            'vessel_name' => $request->vessel_name,
            'shipping_line' => $request->shipping_line,
            'etd' => $request->etd,
            'eta' => $request->eta,
            'status' => $request->status,
        ]);

        if ($request->has('containers') && count($request->containers) > 0) {
            $shipment->containers()->createMany($request->containers);
        }

        // Create an initial draft event
        $shipment->events()->create([
            'event' => 'Shipment ' . $request->status,
            'location' => 'System',
            'event_date' => now(),
        ]);

        // Phase 1: Notify Admins
        $admins = User::where('company_id', $shipment->company_id)
            ->whereHas('role', function ($query) {
                $query->whereIn('name', ['Admin', 'Manager']);
            })->get();
        if ($admins->count() > 0) {
            Notification::send($admins, new AccountActivityNotification($shipment, 'created', auth()->user()->name));
        }

        return response()->json($shipment->load('containers', 'events'), 201);
    }

    public function show($id)
    {
        $shipment = Shipment::with(['containers', 'events', 'importOrder.client', 'exportOrder.client'])->findOrFail($id);
        
        $shipment->client_name = $shipment->type === 'import' && $shipment->importOrder 
                ? $shipment->importOrder->client->company_name 
                : ($shipment->type === 'export' && $shipment->exportOrder 
                    ? $shipment->exportOrder->client->company_name 
                    : 'Unknown');

        return response()->json($shipment);
    }

    public function update(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);
        
        $oldStatus = $shipment->status;
        $shipment->update($request->only(['status', 'eta']));

        // Phase 2: Notify Creator if status improved or changed significantly
        if ($request->has('status') && $oldStatus !== $request->status) {
            if ($shipment->creator) {
                $type = $request->status === 'cancelled' ? 'rejected' : 'approved'; // Using existing types for simplicity
                // Actually let's use the status itself if we want, but AccountActivityNotification expects created/approved/rejected
                $notifType = 'approved';
                if ($request->status === 'Rejected' || $request->status === 'Cancelled') $notifType = 'rejected';
                
                $shipment->creator->notify(new AccountActivityNotification($shipment, $notifType, auth()->user()->name));
            }
        }

        return response()->json($shipment);
    }

    public function storeEvent(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);
        
        $request->validate([
            'event' => 'required|string',
            'location' => 'required|string',
            'event_date' => 'required|date',
        ]);

        $event = $shipment->events()->create([
            'event' => $request->event,
            'location' => $request->location,
            'event_date' => $request->event_date,
        ]);

        return response()->json($event, 201);
    }

    public function dashboardInfo()
    {
        $inTransit = Shipment::where('status', 'In Transit')->count();
        
        $arrivingThisWeek = Shipment::where('status', 'In Transit')
            ->whereBetween('eta', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->count();
            
        $delayedShipments = Shipment::where('status', 'In Transit')
            ->where('eta', '<', Carbon::now()->startOfDay())
            ->count();

        return response()->json([
            'in_transit' => $inTransit,
            'arriving_this_week' => $arrivingThisWeek,
            'delayed_shipments' => $delayedShipments
        ]);
    }
}
