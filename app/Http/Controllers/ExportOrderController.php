<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\ExportOrder;
use App\Services\InventoryService;

class ExportOrderController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        $orders = ExportOrder::with('client')->latest()->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'tracking_number' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'departure_date' => 'nullable|date',
            'status' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $order = ExportOrder::create($validated);

        if ($order->status === 'shipped') {
            $warehouseId = $request->input('warehouse_id', 1);
            $this->inventoryService->handleExportShipping($order, $warehouseId);
        }

        return response()->json($order->load('client'), 201);
    }

    public function show(ExportOrder $exportOrder)
    {
        return response()->json($exportOrder->load('client'));
    }

    public function update(Request $request, ExportOrder $exportOrder)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|required|exists:clients,id',
            'tracking_number' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'departure_date' => 'nullable|date',
            'status' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $exportOrder->status;
        $exportOrder->update($validated);

        // Trigger Inventory OUT if status changes to 'shipped'
        if ($oldStatus !== 'shipped' && $exportOrder->status === 'shipped') {
            $warehouseId = $request->input('warehouse_id', 1);
            $this->inventoryService->handleExportShipping($exportOrder, $warehouseId);
        }

        return response()->json($exportOrder->load('client'));
    }

    public function destroy(ExportOrder $exportOrder)
    {
        $exportOrder->delete();
        return response()->json(null, 204);
    }
}
