<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ASSETS (1000-1999)
            ['code' => '1000', 'name' => 'Petty Cash', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'Bank Account', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '1300', 'name' => 'Inventory', 'type' => 'asset'],
            
            // LIABILITIES (2000-2999)
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'Sales Tax Payable', 'type' => 'liability'],
            
            // EQUITY (3000-3999)
            ['code' => '3000', 'name' => 'Retained Earnings', 'type' => 'equity'],
            ['code' => '3100', 'name' => 'Owner Investment', 'type' => 'equity'],
            
            // REVENUE (4000-4999)
            ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'revenue'],
            ['code' => '4100', 'name' => 'Service Revenue', 'type' => 'revenue'],
            ['code' => '4200', 'name' => 'Exchange Gain', 'type' => 'revenue'],
            
            // EXPENSES (5000-5999)
            ['code' => '5000', 'name' => 'Cost of Goods Sold (COGS)', 'type' => 'expense'],
            ['code' => '5100', 'name' => 'Freight Charges', 'type' => 'expense'],
            ['code' => '5200', 'name' => 'Customs Duties', 'type' => 'expense'],
            ['code' => '5300', 'name' => 'Exchange Loss', 'type' => 'expense'],
            ['code' => '5400', 'name' => 'Office Rent', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            Account::updateOrCreate(['code' => $account['code']], $account);
        }
    }
}
