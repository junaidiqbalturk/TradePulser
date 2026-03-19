<?php

namespace App\Http\Controllers;

use App\Models\Ledger;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    public function clientLedger($client_id)
    {
        $ledgers = Ledger::with(['invoice', 'voucher'])
            ->where('client_id', $client_id)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Calculate running balance
        $balance = 0;
        foreach ($ledgers as $ledger) {
            $balance += $ledger->debit - $ledger->credit;
            $ledger->balance = $balance;
        }

        return response()->json($ledgers);
    }
}
