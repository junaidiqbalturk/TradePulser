<?php

namespace App\Services;

use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Adjust stock level and record transaction.
     */
    public function adjustStock($productId, $warehouseId, $quantity, $type, $reference = null, $notes = null)
    {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $type, $reference, $notes) {
            // 1. Update or Create Stock
            $stock = InventoryStock::firstOrNew([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
            ]);

            if ($type === 'in') {
                $stock->quantity += $quantity;
            } else {
                if ($stock->quantity < $quantity) {
                    throw new Exception("Insufficient stock for product ID: $productId in warehouse ID: $warehouseId");
                }
                $stock->quantity -= $quantity;
            }

            $stock->save();

            // 2. Record Transaction
            $transaction = new InventoryTransaction([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'type' => $type,
                'quantity' => $quantity,
                'notes' => $notes,
            ]);

            if ($reference) {
                $transaction->reference_id = $reference->id;
                $transaction->reference_type = get_class($reference);
            }

            $transaction->save();

            return $stock;
        });
    }

    /**
     * Handle stock IN from an Import Order that arrived.
     */
    public function handleImportArrival($importOrder, $warehouseId)
    {
        foreach ($importOrder->items as $item) {
            if ($item->product_id) {
                $this->adjustStock(
                    $item->product_id, 
                    $warehouseId, 
                    $item->quantity, 
                    'in', 
                    $importOrder, 
                    "Stock arrival from Import Order #{$importOrder->tracking_number}"
                );
            }
        }
    }

    /**
     * Handle stock OUT from an Export Order being shipped.
     */
    public function handleExportShipping($exportOrder, $warehouseId)
    {
        foreach ($exportOrder->items as $item) {
            if ($item->product_id) {
                $this->adjustStock(
                    $item->product_id, 
                    $warehouseId, 
                    $item->quantity, 
                    'out', 
                    $exportOrder, 
                    "Stock outward for Export Order #{$exportOrder->tracking_number}"
                );
            }
        }
    }
}
