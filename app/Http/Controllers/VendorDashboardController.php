<?php

namespace App\Http\Controllers;

use App\Models\VendorBill;
use App\Models\VendorLedger;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VendorDashboardController extends Controller
{
    /**
     * Get statistics for the dashboard widgets.
     */
    public function getStats()
    {
        // 1. Total Payables (Sum of latest balances for all vendors)
        // A simple way is to sum all unpaid/partial bills, or query the ledgers
        $totalPayables = VendorLedger::whereIn('id', function($query) {
            $query->selectRaw('MAX(id)')->from('vendor_ledgers')->groupBy('vendor_id');
        })->sum('balance');

        // 2. Overdue Vendor Bills (Bills where due date passed and status != paid)
        $overdueBills = VendorBill::whereIn('status', ['unpaid', 'partial'])
            ->where('due_date', '<', Carbon::today())
            ->sum('total_amount'); // Alternatively, calculate true remaining balance per bill

        // 3. Payments Due This Week
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $dueThisWeek = VendorBill::whereIn('status', ['unpaid', 'partial'])
            ->whereBetween('due_date', [$startOfWeek, $endOfWeek])
            ->sum('total_amount');

        return response()->json([
            'total_payables' => $totalPayables,
            'overdue_bills' => $overdueBills,
            'due_this_week' => $dueThisWeek
        ]);
    }
}
