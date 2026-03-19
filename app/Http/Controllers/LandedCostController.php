<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LandedCost;
use App\Models\ImportOrder;
use App\Services\LandedCostService;

class LandedCostController extends Controller
{
    protected $landedCostService;

    public function __construct(LandedCostService $landedCostService)
    {
        $this->landedCostService = $landedCostService;
    }

    public function index(ImportOrder $importOrder)
    {
        return response()->json($importOrder->landedCosts);
    }

    public function store(Request $request, ImportOrder $importOrder)
    {
        $validated = $request->validate([
            'cost_category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'allocation_method' => 'required|string|in:value,weight,volume',
            'notes' => 'nullable|string',
        ]);

        $cost = $importOrder->landedCosts()->create($validated);
        
        // Recalculate landed costs for items
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json($cost, 201);
    }

    public function update(Request $request, ImportOrder $importOrder, LandedCost $landedCost)
    {
        $validated = $request->validate([
            'cost_category' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'allocation_method' => 'sometimes|required|string|in:value,weight,volume',
            'notes' => 'nullable|string',
        ]);

        $landedCost->update($validated);
        
        // Recalculate landed costs for items
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json($landedCost);
    }

    public function destroy(ImportOrder $importOrder, LandedCost $landedCost)
    {
        $landedCost->delete();
        
        // Recalculate landed costs for items
        $this->landedCostService->allocateCosts($importOrder);

        return response()->json(null, 204);
    }

    public function marginAnalysis(ImportOrder $importOrder)
    {
        $importOrder->load(['items', 'landedCosts']);
        
        $totalLandedCost = $importOrder->items->sum('total_landed_cost');
        $totalSalesValue = $importOrder->items->sum(fn($item) => ($item->sales_price ?? 0) * $item->quantity);
        $projectedProfit = $totalSalesValue - $totalLandedCost;
        $marginPercentage = $totalSalesValue > 0 ? round(($projectedProfit / $totalSalesValue) * 100, 2) : 0;

        $analysisItems = $importOrder->items->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->product_name,
                'landed_cost' => $item->landed_unit_cost,
                'sales_price' => $item->sales_price ?? 0,
            ];
        });

        return response()->json([
            'import_order_id' => $importOrder->id,
            'total_landed_cost' => $totalLandedCost,
            'total_sales_value' => $totalSalesValue,
            'projected_profit' => $projectedProfit,
            'margin_percentage' => $marginPercentage,
            'items' => $analysisItems
        ]);
    }
}
