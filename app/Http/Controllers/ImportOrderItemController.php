<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ImportOrderItem;
use App\Models\ImportOrder;
use App\Services\LandedCostService;

class ImportOrderItemController extends Controller
{
    protected $landedCostService;

    public function __construct(LandedCostService $landedCostService)
    {
        $this->landedCostService = $landedCostService;
    }

    public function index(ImportOrder $importOrder)
    {
        return response()->json($importOrder->items);
    }

    public function store(Request $request, ImportOrder $importOrder)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'product_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
        ]);

        $item = $importOrder->items()->create($validated);
        
        // Recalculate landed costs
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json($item->refresh(), 201);
    }

    public function update(Request $request, ImportOrder $importOrder, ImportOrderItem $importOrderItem)
    {
        $validated = $request->validate([
            'product_id' => 'sometimes|nullable|exists:products,id',
            'product_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'sometimes|required|numeric|min:0.01',
            'unit_price' => 'sometimes|required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
        ]);

        $importOrderItem->update($validated);
        
        // Recalculate landed costs
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json($importOrderItem->refresh());
    }

    public function destroy(ImportOrder $importOrder, ImportOrderItem $importOrderItem)
    {
        $importOrderItem->delete();
        
        // Recalculate landed costs
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json(null, 204);
    }
}
