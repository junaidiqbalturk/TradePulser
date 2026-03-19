<?php

namespace App\Services;

use App\Models\ImportOrder;
use App\Models\ImportOrderItem;
use App\Models\LandedCost;

class LandedCostService
{
    public function allocateCosts(ImportOrder $order)
    {
        $items = $order->items;
        $costs = $order->landedCosts;

        if ($items->isEmpty()) {
            return;
        }

        // Reset landed costs for all items before recalculating
        foreach ($items as $item) {
            $item->total_landed_cost = $item->unit_price * $item->quantity;
            $item->landed_unit_cost = $item->unit_price;
        }

        foreach ($costs as $cost) {
            $this->allocateSingleCost($cost, $items);
        }

        // Save updated items
        foreach ($items as $item) {
            $item->save();
        }
    }

    private function allocateSingleCost(LandedCost $cost, $items)
    {
        $totalValue = $items->sum(fn($item) => $item->unit_price * $item->quantity);
        $totalWeight = $items->sum('weight');
        $totalVolume = $items->sum('volume');

        foreach ($items as $item) {
            $allocation = 0;

            switch ($cost->allocation_method) {
                case 'weight':
                    if ($totalWeight > 0) {
                        $allocation = ($item->weight / $totalWeight) * $cost->amount;
                    }
                    break;
                case 'volume':
                    if ($totalVolume > 0) {
                        $allocation = ($item->volume / $totalVolume) * $cost->amount;
                    }
                    break;
                case 'value':
                default:
                    if ($totalValue > 0) {
                        $itemValue = $item->unit_price * $item->quantity;
                        $allocation = ($itemValue / $totalValue) * $cost->amount;
                    }
                    break;
            }

            $item->total_landed_cost += $allocation;
            $item->landed_unit_cost = $item->total_landed_cost / $item->quantity;
        }
    }
}
