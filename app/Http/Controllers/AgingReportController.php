<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use Carbon\Carbon;

class AgingReportController extends Controller
{
    public function agingSummary()
    {
        $invoices = Invoice::whereIn('status', ['unpaid', 'partially_paid'])
            ->with('client')
            ->get();

        $now = Carbon::now();

        $buckets = [
            'current' => ['total' => 0, 'count' => 0],
            '30_days' => ['total' => 0, 'count' => 0],
            '60_days' => ['total' => 0, 'count' => 0],
            '90_plus' => ['total' => 0, 'count' => 0],
        ];

        foreach ($invoices as $invoice) {
            $daysOld = $now->diffInDays(Carbon::parse($invoice->date));
            $remaining = $invoice->total_amount - $invoice->reconciliations()->sum('amount_allocated');

            if ($daysOld < 30) {
                $buckets['current']['total'] += $remaining;
                $buckets['current']['count']++;
            } elseif ($daysOld < 60) {
                $buckets['30_days']['total'] += $remaining;
                $buckets['30_days']['count']++;
            } elseif ($daysOld < 90) {
                $buckets['60_days']['total'] += $remaining;
                $buckets['60_days']['count']++;
            } else {
                $buckets['90_plus']['total'] += $remaining;
                $buckets['90_plus']['count']++;
            }
        }

        return response()->json($buckets);
    }
}
