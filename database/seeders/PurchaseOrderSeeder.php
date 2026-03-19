<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Vendor;
use App\Models\Product;
use Carbon\Carbon;

class PurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Vendor::all();
        $products = Product::all();

        if ($vendors->isEmpty() || $products->isEmpty()) {
            return;
        }

        $statuses = ['draft', 'approved', 'ordered', 'received', 'completed'];
        
        foreach ($statuses as $status) {
            $vendor = $vendors->random();
            $itemsCount = rand(2, 4);
            
            $po = PurchaseOrder::create([
                'po_number' => 'PO-' . date('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(4)),
                'vendor_id' => $vendor->id,
                'order_date' => Carbon::now()->subDays(rand(1, 10))->toDateString(),
                'expected_delivery' => Carbon::now()->addDays(rand(5, 15))->toDateString(),
                'currency' => $vendor->currency,
                'total_amount' => 0,
                'status' => $status,
                'notes' => 'Sample PO in ' . $status . ' status',
                'created_by' => 1, // Assuming admin or first user
            ]);

            $total = 0;
            for ($i = 0; $i < $itemsCount; $i++) {
                $product = $products->random();
                $qty = rand(10, 100);
                $price = $product->unit_cost * rand(1, 2);
                $lineTotal = $qty * $price;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'total_price' => $lineTotal,
                ]);

                $total += $lineTotal;
            }

            $po->update(['total_amount' => $total]);
        }
    }
}
