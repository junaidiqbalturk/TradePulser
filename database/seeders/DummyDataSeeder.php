<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Voucher;
use App\Models\Ledger;
use App\Models\ImportOrder;
use App\Models\ExportOrder;
use App\Services\AccountingService;
use App\Services\ExchangeRateService;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    protected $accountingService;
    protected $exchangeRateService;

    public function __construct(AccountingService $accountingService, ExchangeRateService $exchangeRateService)
    {
        $this->accountingService = $accountingService;
        $this->exchangeRateService = $exchangeRateService;
    }

    public function run(): void
    {
        // 0. Initial Setup (Products & Warehouses)
        $warehouses = [
            Warehouse::firstOrCreate(['name' => 'Main Karachi Warehouse'], ['location' => 'Port Qasim', 'status' => 'active']),
            Warehouse::firstOrCreate(['name' => 'Lahore Distribution Hub'], ['location' => 'Bund Road', 'status' => 'active']),
        ];

        $products = [
            Product::firstOrCreate(['sku' => 'SOL-550'], ['name' => 'Solar Panel 550W', 'unit_cost' => 120, 'unit' => 'pcs']),
            Product::firstOrCreate(['sku' => 'BAT-LITH-100'], ['name' => 'Lithium Battery 100Ah', 'unit_cost' => 450, 'unit' => 'pcs']),
            Product::firstOrCreate(['sku' => 'INV-HYB-5K'], ['name' => 'Hybrid Inverter 5kW', 'unit_cost' => 800, 'unit' => 'pcs']),
            Product::firstOrCreate(['sku' => 'WIRE-COP-10'], ['name' => 'Copper Wire 10mm', 'unit_cost' => 5, 'unit' => 'meters']),
        ];

        // Add 20 Clients
        $clients = Client::factory(20)->create();

        // Start Date: 01-Jan-2024
        $startDate = Carbon::create(2024, 1, 1);
        $endDate = Carbon::now();

        // 1. Generate Historical Data (2024 - 2026)
        $currentDate = clone $startDate;
        while ($currentDate->lte($endDate)) {
            // Randomly create Invoices (approx 1 per week)
            if (rand(1, 7) === 1) {
                $client = $clients->random();
                $this->createHistoricalInvoice($client, clone $currentDate);
            }

            // Randomly create Receipts (approx 1 per 10 days)
            if (rand(1, 10) === 1) {
                $client = $clients->random();
                $this->createHistoricalReceipt($client, clone $currentDate);
            }

            // Import/Export Orders
            if (rand(1, 10) > 7) {
                $client = $clients->random();
                $order = ImportOrder::create([
                    'client_id' => $client->id,
                    'tracking_number' => 'IMP-' . strtoupper(Str::random(6)),
                    'origin' => ['China', 'USA', 'Dubai', 'Germany'][rand(0, 3)],
                    'expected_arrival' => $currentDate->copy()->addDays(rand(5, 15))->toDateString(),
                    'status' => ['pending', 'intransit', 'arrived'][rand(0, 2)],
                    'created_at' => clone $currentDate,
                    'updated_at' => clone $currentDate,
                ]);

                // Add 2-4 items
                for ($i = 0; $i < rand(2, 4); $i++) {
                    $product = collect($products)->random();
                    $unitCost = $product->unit_cost;
                    $item = $order->items()->create([
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => rand(10, 100),
                        'unit_price' => $unitCost,
                        'sales_price' => $unitCost * 1.4, // 40% markup
                        'weight' => rand(1, 10),
                        'volume' => rand(1, 5),
                    ]);

                    // If arrived, add to stock
                    if ($order->status === 'arrived') {
                        $warehouse = collect($warehouses)->random();
                        $stock = InventoryStock::firstOrNew([
                            'product_id' => $product->id,
                            'warehouse_id' => $warehouse->id,
                        ]);
                        $stock->quantity += $item->quantity;
                        $stock->save();

                        InventoryTransaction::create([
                            'product_id' => $product->id,
                            'warehouse_id' => $warehouse->id,
                            'type' => 'in',
                            'quantity' => $item->quantity,
                            'reference_id' => $order->id,
                            'reference_type' => ImportOrder::class,
                            'notes' => 'Initial seed arrival',
                            'created_at' => $order->created_at,
                        ]);
                    }
                }

                // Add some landed costs
                $order->landedCosts()->create([
                    'cost_category' => 'Freight',
                    'amount' => rand(100, 500),
                    'allocation_method' => 'value',
                ]);
                $order->landedCosts()->create([
                    'cost_category' => 'Customs',
                    'amount' => rand(50, 200),
                    'allocation_method' => 'value',
                ]);

                // Allocate costs
                app(\App\Services\LandedCostService::class)->allocateCosts($order);
            }

            $currentDate->addDays(1);
            // Export Orders
            if (rand(1, 10) > 7) {
                $client = $clients->random();
                $order = ExportOrder::create([
                    'client_id' => $client->id,
                    'tracking_number' => 'EXP-' . strtoupper(Str::random(6)),
                    'destination' => ['London', 'New York', 'Tokyo', 'Singapore'][rand(0, 3)],
                    'departure_date' => $currentDate->copy()->addDays(rand(2, 10))->toDateString(),
                    'status' => ['pending', 'shipped', 'delivered'][rand(0, 2)],
                    'created_at' => clone $currentDate,
                    'updated_at' => clone $currentDate,
                ]);

                // Add 1-2 items
                for ($i = 0; $i < rand(1, 2); $i++) {
                    $product = collect($products)->random();
                    $item = $order->items()->create([
                        'product_id' => $product->id,
                        'quantity' => rand(5, 20),
                        'unit_price' => $product->unit_cost * 1.5,
                        'total_price' => 0, // calculated below
                    ]);
                    $item->update(['total_price' => $item->quantity * $item->unit_price]);

                    // If shipped/delivered, reduce stock
                    if (in_array($order->status, ['shipped', 'delivered'])) {
                        $warehouse = collect($warehouses)->random();
                        $stock = InventoryStock::where('product_id', $product->id)
                            ->where('warehouse_id', $warehouse->id)
                            ->first();
                        
                        // In seeder, don't worry too much about negative stock, just ensure transactions exist
                        if ($stock) {
                            $stock->quantity -= $item->quantity;
                            $stock->save();
                        }

                        InventoryTransaction::create([
                            'product_id' => $product->id,
                            'warehouse_id' => $warehouse->id,
                            'type' => 'out',
                            'quantity' => $item->quantity,
                            'reference_id' => $order->id,
                            'reference_type' => ExportOrder::class,
                            'notes' => 'Seed export dispatch',
                            'created_at' => $order->created_at,
                        ]);
                    }
                }
            }
        }

        // 2. Ensure "Aging" buckets are specifically populated with UNPAID invoices
        $agingBuckets = [
            'current' => 5,
            '30_days' => 45,
            '60_days' => 75,
            '90_plus' => 120
        ];

        foreach ($agingBuckets as $label => $daysAgo) {
            $date = Carbon::now()->subDays($daysAgo);
            foreach ($clients->random(3) as $client) {
                $this->createHistoricalInvoice($client, $date, 'unpaid');
            }
        }

        // 3. Unreconciled Vouchers for the Reconciliation report
        foreach ($clients->random(5) as $client) {
            $this->createHistoricalReceipt($client, Carbon::now()->subDays(5), false); 
        }
    }

    private function createHistoricalInvoice($client, $date, $status = 'unpaid')
    {
        // Use more robust unique ID generation to prevent seeder collisions
        $invNum = 'INV-' . strtoupper(Str::random(4) . '-' . Str::random(4));
        
        $invoice = Invoice::create([
            'invoice_number' => $invNum,
            'client_id' => $client->id,
            'date' => $date->toDateString(),
            'currency' => 'PKR',
            'exchange_rate' => 1.0,
            'base_amount' => 0, 
            'discount' => rand(0, 500),
            'tax' => rand(500, 2000),
            'total_amount' => 0, 
            'status' => $status === 'unpaid' ? 'pending' : $status, // Adjust to new statuses
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        $items = InvoiceItem::factory(rand(1, 3))->create([
            'invoice_id' => $invoice->id,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
        
        $total = $items->sum('total') + $invoice->tax - $invoice->discount;
        $invoice->update(['total_amount' => $total, 'base_amount' => $total]);

        // Client Ledger
        $currentBalance = Ledger::where('client_id', $invoice->client_id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->value('balance') ?? 0;

        Ledger::create([
            'client_id' => $invoice->client_id,
            'invoice_id' => $invoice->id,
            'date' => $invoice->date,
            'description' => 'Invoice ' . $invoice->invoice_number,
            'debit' => $invoice->total_amount,
            'credit' => 0,
            'balance' => $currentBalance + $invoice->total_amount,
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        // GL Auto-Post
        $this->accountingService->autoPostInvoice($invoice);
    }

    private function createHistoricalReceipt($client, $date, $reconcile = true)
    {
        $vNum = 'RV-' . strtoupper(Str::random(4) . '-' . Str::random(4));
        $amount = rand(2000, 25000);
        
        $v = Voucher::create([
            'voucher_number' => $vNum,
            'client_id' => $client->id,
            'type' => 'receipt',
            'date' => $date->toDateString(),
            'amount' => $amount,
            'base_amount' => $amount,
            'exchange_rate' => 1.0,
            'currency' => 'PKR',
            'payment_method' => rand(0, 1) ? 'cash' : 'bank',
            'status' => 'posted',
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        // Client Ledger
        $currentBalance = Ledger::where('client_id', $v->client_id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->value('balance') ?? 0;

        Ledger::create([
            'client_id' => $v->client_id,
            'voucher_id' => $v->id,
            'date' => $v->date,
            'description' => 'Receipt ' . $v->voucher_number,
            'debit' => 0,
            'credit' => $v->amount,
            'balance' => $currentBalance - $v->amount,
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        // GL Auto-Post
        $this->accountingService->autoPostVoucher($v);
    }
}
