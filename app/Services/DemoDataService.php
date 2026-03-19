<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Invoice;
use App\Models\Company;

class DemoDataService
{
    public function seed(Company $company)
    {
        // 1. Create a Sample Client
        $client = Client::create([
            'company_id' => $company->id,
            'company_name' => 'Global Trade Inc.',
            'email' => 'contact@globaltrade.example.com',
            'phone' => '+1 555-0123',
            'address' => '123 Business Ave, New York, NY',
            'country' => 'United States',
        ]);

        // 2. Create a Sample Vendor
        $vendor = Vendor::create([
            'company_id' => $company->id,
            'vendor_code' => 'VEND-' . $company->id . '-001',
            'company_name' => 'Primary Logistics Co.',
            'email' => 'shipping@primelogistics.example.com',
            'phone' => '+1 555-9876',
            'address' => '456 Port Rd, Los Angeles, CA',
            'country' => 'United States',
        ]);

        // 3. Create Sample Products
        $product1 = Product::create([
            'company_id' => $company->id,
            'name' => 'Industrial Generator X1',
            'sku' => 'GEN-' . $company->id . '-X1-001',
            'description' => 'High-performance industrial generator for emergency backup.',
            'price' => 5000.00,
            'unit' => 'pcs',
        ]);

        $product2 = Product::create([
            'company_id' => $company->id,
            'name' => 'Precision Steel Bolts',
            'sku' => 'BOLT-' . $company->id . '-S-500',
            'description' => 'Case of 500 precision-engineered grade 8 steel bolts.',
            'price' => 250.00,
            'unit' => 'case',
        ]);

        // 4. Create a Sample Invoice
        Invoice::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'invoice_number' => 'INV-' . $company->id . '-' . date('Y') . '-001',
            'date' => now(),
            'total_amount' => 5250.00,
            'currency' => $company->currency ?? 'USD',
        ]);
    }
}
