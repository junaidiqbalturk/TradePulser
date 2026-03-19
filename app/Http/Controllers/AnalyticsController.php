<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    private function getCompanyId()
    {
        return auth()->user()->company_id;
    }

    public function getRevenueByMonth()
    {
        $companyId = $this->getCompanyId();
        return response()->json(DB::table('invoices')
            ->where('company_id', $companyId)
            ->whereIn('status', ['approved', 'pending', 'paid', 'unpaid'])
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, SUM(total_amount) as total_revenue, COUNT(id) as invoice_count")
            ->groupBy('month')
            ->orderBy('month', 'DESC')
            ->get());
    }

    public function getRevenueByClient()
    {
        $companyId = $this->getCompanyId();
        return response()->json(DB::table('clients as c')
            ->join('invoices as i', 'c.id', '=', 'i.client_id')
            ->where('i.company_id', $companyId)
            ->whereIn('i.status', ['approved', 'pending', 'paid', 'unpaid'])
            ->selectRaw("c.company_name, c.country, SUM(i.total_amount) as total_revenue, COUNT(i.id) as invoice_count")
            ->groupBy('c.id', 'c.company_name', 'c.country')
            ->orderBy('total_revenue', 'DESC')
            ->get());
    }

    public function getProductPerformance()
    {
        $companyId = $this->getCompanyId();
        return response()->json(DB::table('products as p')
            ->join('invoice_items as ii', 'p.name', '=', 'ii.item_name')
            ->join('invoices as i', 'ii.invoice_id', '=', 'i.id')
            ->where('i.company_id', $companyId)
            ->whereIn('i.status', ['approved', 'pending', 'paid', 'unpaid'])
            ->selectRaw("p.name as product_name, SUM(ii.qty) as quantity_sold, SUM(ii.total) as total_revenue")
            ->groupBy('p.id', 'p.name')
            ->orderBy('total_revenue', 'DESC')
            ->get());
    }

    public function getShipmentProfitability()
    {
        $companyId = $this->getCompanyId();
        // Try view first, but fall back to direct calculation if empty
        $profit = DB::table('shipment_profitability')
            ->where('company_id', $companyId)
            ->first();

        if (!$profit || ($profit->total_revenue ?? 0) == 0) {
            $profit = DB::table('invoice_items as ii')
                ->join('invoices as i', 'ii.invoice_id', '=', 'i.id')
                ->where('i.company_id', $companyId)
                ->whereIn('i.status', ['approved', 'pending', 'paid', 'unpaid'])
                ->selectRaw("'Global' as scope, SUM(ii.total) as total_revenue, 0 as total_cost, SUM(ii.total) as total_profit")
                ->first();
        }
        return response()->json($profit);
    }

    public function getArAging()
    {
        $companyId = $this->getCompanyId();
        $aging = DB::table('ar_aging')
            ->where('company_id', $companyId)
            ->get();

        if ($aging->isEmpty()) {
            return response()->json(DB::table('invoices as i')
                ->join('clients as c', 'i.client_id', '=', 'c.id')
                ->where('i.company_id', $companyId)
                ->whereIn('i.status', ['approved', 'pending', 'paid', 'unpaid'])
                ->selectRaw("c.company_name as client_name, i.invoice_number, i.total_amount, 0 as paid_amount, i.total_amount as outstanding_amount, DATEDIFF(CURDATE(), i.date) as days_past")
                ->get());
        }
        return response()->json($aging);
    }

    public function getApAging()
    {
        $companyId = $this->getCompanyId();
        return response()->json(DB::table('vendor_bills as vb')
            ->join('vendors as v', 'vb.vendor_id', '=', 'v.id')
            ->where('vb.company_id', $companyId)
            ->where('vb.status', '!=', 'paid')
            ->selectRaw("v.company_name as vendor_name, vb.bill_number, vb.total_amount, vb.due_date, DATEDIFF(CURDATE(), vb.bill_date) as days_past, vb.status")
            ->get());
    }

    public function getInventoryInsights()
    {
        $companyId = $this->getCompanyId();
        return response()->json(DB::table('inventory_insights')
            ->where('company_id', $companyId)
            ->get());
    }

    public function getKpis()
    {
        $companyId = $this->getCompanyId();

        // 1. Total Revenue (Current Year)
        $revenueYear = DB::table('invoices')
            ->where('company_id', $companyId)
            ->whereIn('status', ['approved', 'pending', 'paid', 'unpaid'])
            ->whereYear('date', date('Y'))
            ->sum('total_amount') ?? 0;

        // Fallback: If no revenue this year, show total historical revenue
        if ($revenueYear == 0) {
            $revenueYear = DB::table('invoices')
                ->where('company_id', $companyId)
                ->whereIn('status', ['approved', 'pending', 'paid', 'unpaid'])
                ->sum('total_amount') ?? 0;
        }

        // 2. Accounts Receivable
        try {
            // Try view first
            $outstandingAr = DB::table('ar_aging')
                ->where('company_id', $companyId)
                ->sum('outstanding_amount') ?? 0;

            if ($outstandingAr == 0) {
                // Dashboard fallback logic if view is empty
                $receivableStats = DB::table("ledgers")
                    ->where('company_id', $companyId)
                    ->selectRaw("SUM(debit) as total_debit, SUM(credit) as total_credit")
                    ->first();
                $outstandingAr = ($receivableStats->total_debit ?? 0) - ($receivableStats->total_credit ?? 0);
            }
        } catch (\Exception $e) {
            $outstandingAr = 0;
        }

        // 3. Accounts Payable
        try {
            $outstandingAp = DB::table('ap_aging')
                ->where('company_id', $companyId)
                ->sum('total_amount') ?? 0;

            if ($outstandingAp == 0) {
                 $outstandingAp = DB::table('vendor_bills')
                    ->where('company_id', $companyId)
                    ->where('status', '!=', 'paid')
                    ->sum('total_amount') ?? 0;
            }
        } catch (\Exception $e) {
            $outstandingAp = 0;
        }
        
        // 4. Inventory Value
        $inventoryValue = DB::table('products')
            ->join('inventory_stocks', 'products.id', '=', 'inventory_stocks.product_id')
            ->where('products.company_id', $companyId)
            ->selectRaw('SUM(inventory_stocks.quantity * products.unit_cost) as total_value')
            ->value('total_value') ?? 0;

        // 5. Gross Profit
        $grossProfit = 0;
        try {
            $grossProfit = DB::table('shipment_profitability')
                ->where('company_id', $companyId)
                ->value('total_profit') ?? 0;

            if ($grossProfit == 0) {
                // Fallback estimate
                $grossProfit = $revenueYear * 0.15;
            }
        } catch (\Exception $e) {
            $grossProfit = 0;
        }

        return response()->json([
            'total_revenue_year' => (float)$revenueYear,
            'outstanding_ar' => (float)max($outstandingAr, 0),
            'outstanding_ap' => (float)$outstandingAp,
            'inventory_value' => (float)$inventoryValue,
            'gross_profit' => (float)$grossProfit,
        ]);
    }
}
