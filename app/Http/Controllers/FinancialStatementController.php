<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialStatementController extends Controller
{
    public function trialBalance(Request $request)
    {
        $toDate = $request->to_date ?? Carbon::now()->toDateString();

        $balance = Account::with(['items' => function ($query) use ($toDate) {
            $query->whereHas('entry', function ($q) use ($toDate) {
                $q->where('date', '<=', $toDate);
            });
        }])->get()->map(function ($account) {
            $totalDebit = $account->items->sum('debit');
            $totalCredit = $account->items->sum('credit');
            
            return [
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'debit' => $totalDebit,
                'credit' => $totalCredit,
                'balance' => $totalDebit - $totalCredit
            ];
        });

        return response()->json($balance);
    }

    public function profitAndLoss(Request $request)
    {
        $fromDate = $request->from_date ?? '2024-01-01';
        $toDate = $request->to_date ?? Carbon::now()->toDateString();

        $revenue = $this->getAccountGroupBalance('revenue', $fromDate, $toDate);
        $expenses = $this->getAccountGroupBalance('expense', $fromDate, $toDate);

        return response()->json([
            'period' => "From $fromDate to $toDate",
            'revenue' => $revenue,
            'expenses' => $expenses,
            'net_profit' => $revenue['total'] - $expenses['total']
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $toDate = $request->to_date ?? Carbon::now()->toDateString();

        $assets = $this->getAccountGroupBalance('asset', null, $toDate);
        $liabilities = $this->getAccountGroupBalance('liability', null, $toDate);
        $equity = $this->getAccountGroupBalance('equity', null, $toDate);

        // Add Retained Earnings (Net Profit from all time)
        // For simplicity, we assume equity includes it or we calculate it here.

        return response()->json([
            'as_of' => $toDate,
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'is_balanced' => abs($assets['total'] - ($liabilities['total'] + $equity['total'])) < 0.01
        ]);
    }

    public function accounts()
    {
        return response()->json(Account::orderBy('code')->get());
    }

    public function journalRegistry()
    {
        return response()->json(
            \App\Models\JournalEntry::with(['items.account'])
                ->orderBy('date', 'desc')
                ->get()
        );
    }

    private function getAccountGroupBalance($type, $fromDate = null, $toDate = null)
    {
        $query = Account::where('type', $type);
        
        $accounts = $query->with(['items' => function ($q) use ($fromDate, $toDate) {
            $q->whereHas('entry', function ($sub) use ($fromDate, $toDate) {
                if ($fromDate) $sub->where('date', '>=', $fromDate);
                if ($toDate) $sub->where('date', '<=', $toDate);
            });
        }])->get();

        $details = $accounts->map(function ($acc) {
            $balance = $acc->items->sum('debit') - $acc->items->sum('credit');
            // For revenue and liability, credit is positive. 
            // We'll return absolute or adjusted based on type for reporting.
            if (in_array($acc->type, ['revenue', 'liability', 'equity'])) {
                $balance = $acc->items->sum('credit') - $acc->items->sum('debit');
            }
            return [
                'name' => $acc->name,
                'balance' => $balance
            ];
        });

        return [
            'total' => $details->sum('balance'),
            'details' => $details
        ];
    }
}
