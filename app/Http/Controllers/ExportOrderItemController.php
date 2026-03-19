<?php

namespace App\Http\Controllers;

use App\Models\ExportOrder;
use App\Models\ExportOrderItem;
use Illuminate\Http\Request;

class ExportOrderItemController extends Controller
{
    public function index(ExportOrder $exportOrder)
    {
        return response()->json($exportOrder->items);
    }

    public function store(Request $request, ExportOrder $exportOrder)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $validated['total_price'] = $validated['quantity'] * $validated['unit_price'];

        $item = $exportOrder->items()->create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, ExportOrder $exportOrder, ExportOrderItem $exportOrderItem)
    {
        $validated = $request->validate([
            'product_id' => 'sometimes|required|exists:products,id',
            'quantity' => 'sometimes|required|numeric|min:0.01',
            'unit_price' => 'sometimes|required|numeric|min:0',
        ]);

        if (isset($validated['quantity']) || isset($validated['unit_price'])) {
            $qty = $validated['quantity'] ?? $exportOrderItem->quantity;
            $price = $validated['unit_price'] ?? $exportOrderItem->unit_price;
            $validated['total_price'] = $qty * $price;
        }

        $exportOrderItem->update($validated);
        return response()->json($exportOrderItem);
    }

    public function destroy(ExportOrder $exportOrder, ExportOrderItem $exportOrderItem)
    {
        $exportOrderItem->delete();
        return response()->json(null, 204);
    }
}
