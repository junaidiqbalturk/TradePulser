<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\ImportOrder;
use App\Services\InventoryService;

class ImportOrderController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        $orders = ImportOrder::with('client')->latest()->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'tracking_number' => 'nullable|string|max:255',
            'origin' => 'nullable|string|max:255',
            'expected_arrival' => 'nullable|date',
            'status' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $order = ImportOrder::create($validated);
        return response()->json($order->load('client'), 201);
    }

    public function show(ImportOrder $importOrder)
    {
        return response()->json($importOrder->load(['client', 'items']));
    }

    public function update(Request $request, ImportOrder $importOrder)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|required|exists:clients,id',
            'tracking_number' => 'nullable|string|max:255',
            'origin' => 'nullable|string|max:255',
            'expected_arrival' => 'nullable|date',
            'status' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $importOrder->status;
        $importOrder->update($validated);

        // Trigger Inventory IN if status changes to 'arrived'
        if ($oldStatus !== 'arrived' && $importOrder->status === 'arrived') {
            $warehouseId = $request->input('warehouse_id', 1); 
            $this->inventoryService->handleImportArrival($importOrder, $warehouseId);

            // Update Purchase Order status if linked
            if ($importOrder->purchase_order_id) {
                $po = $importOrder->purchaseOrder;
                if ($po && $po->status !== 'completed') {
                    $po->update(['status' => 'received']);
                }
            }
        }

        return response()->json($importOrder->load(['client', 'purchaseOrder']));
    }

    public function destroy(ImportOrder $importOrder)
    {
        $importOrder->delete();
        return response()->json(null, 204);
    }
}
