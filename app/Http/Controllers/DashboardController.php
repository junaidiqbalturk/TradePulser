<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        $cacheKey = "dashboard_data_{$companyId}";

        $data = Cache::remember($cacheKey, 300, function () use ($companyId) {
            // 1. Core Stats
            $totalClients = Client::count();
            $receivableStats = \DB::table("ledgers")
                ->where('company_id', $companyId)
                ->selectRaw("SUM(debit) as total_debit, SUM(credit) as total_credit")
                ->first();
            $totalReceivable = ($receivableStats->total_debit ?? 0) - ($receivableStats->total_credit ?? 0);
            
            $totalPaymentsReceived = Voucher::where("type", "receipt")->sum("amount");
            
            $totalImports = \App\Models\ImportOrder::count();
            $totalExports = \App\Models\ExportOrder::count();

            // 2. Recent Records - Optimized with eager loading
            $recentTransactions = Voucher::with("client")->orderBy("date", "desc")->orderBy("id", "desc")->take(5)->get();
            $recentDocuments = \App\Models\Document::with(['documentable', 'user'])->orderBy('created_at', 'desc')->take(5)->get();
            $recentGenerated = \App\Models\GeneratedDocument::with('user')->orderBy('created_at', 'desc')->take(5)->get();

            // 3. Procurement Stats
            $procurementStats = [
                'open_pos' => \App\Models\PurchaseOrder::whereIn('status', ['approved', 'ordered'])->count(),
                'pending_deliveries' => \App\Models\PurchaseOrder::where('status', 'ordered')->count(),
                'total_po_value' => \App\Models\PurchaseOrder::whereMonth('order_date', now()->month)
                    ->whereYear('order_date', now()->year)
                    ->sum('total_amount'),
            ];
                
            // 4. Revenue Data (Last 6 Months)
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
            $revenueDataRaw = Voucher::where("type", "receipt")
                ->where('date', '>=', $sixMonthsAgo)
                ->selectRaw("DATE_FORMAT(date, '%b') as month_name, SUM(amount) as revenue, DATE_FORMAT(date, '%Y-%m') as sort_key")
                ->groupBy('sort_key', 'month_name')
                ->orderBy('sort_key')
                ->get()
                ->pluck('revenue', 'month_name')
                ->toArray();

            $revenueData = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = now()->subMonths($i)->format("M");
                $revenueData[] = [
                    "name" => $month,
                    "revenue" => (float)($revenueDataRaw[$month] ?? 0)
                ];
            }

            // 5. Activity Data (Last 7 Days)
            $startOfWeek = now()->startOfWeek();
            
            $importsRaw = \App\Models\ImportOrder::where('created_at', '>=', $startOfWeek)
                ->selectRaw("DATE_FORMAT(created_at, '%a') as day_name, COUNT(*) as count, DATE(created_at) as date")
                ->groupBy('date', 'day_name')
                ->get()
                ->pluck('count', 'day_name')
                ->toArray();

            $exportsRaw = \App\Models\ExportOrder::where('created_at', '>=', $startOfWeek)
                ->selectRaw("DATE_FORMAT(created_at, '%a') as day_name, COUNT(*) as count, DATE(created_at) as date")
                ->groupBy('date', 'day_name')
                ->get()
                ->pluck('count', 'day_name')
                ->toArray();

            $activityData = [];
            for ($i = 0; $i < 7; $i++) {
                $date = $startOfWeek->copy()->addDays($i)->format("D");
                $activityData[] = [
                    "name" => $date,
                    "import" => $importsRaw[$date] ?? 0,
                    "export" => $exportsRaw[$date] ?? 0
                ];
            }

            return [
                "total_clients" => $totalClients,
                "total_receivable" => max($totalReceivable, 0),
                "total_payments_received" => $totalPaymentsReceived,
                "total_imports" => $totalImports,
                "total_exports" => $totalExports,
                "recent_transactions" => $recentTransactions,
                "recent_documents" => $recentDocuments,
                "recent_generated" => $recentGenerated,
                "revenue_data" => $revenueData,
                "activity_data" => $activityData,
                "open_pos" => $procurementStats['open_pos'],
                "pending_deliveries" => $procurementStats['pending_deliveries'],
                "total_po_value" => $procurementStats['total_po_value'],
            ];
        });

        return response()->json($data);
    }

    public function exchangeRates(\App\Services\ExchangeRateService $service)
    {
        return response()->json([
            "USD" => $service->getRate("USD", "PKR"),
            "EUR" => $service->getRate("EUR", "PKR"),
            "AED" => $service->getRate("AED", "PKR"),
            "GBP" => $service->getRate("GBP", "PKR"),
        ]);
    }
}