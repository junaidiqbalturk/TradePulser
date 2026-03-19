<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\VendorLedger;
use Illuminate\Http\Request;

class VendorLedgerController extends Controller
{
    /**
     * Display the ledger for a specific vendor.
     */
    public function show(Vendor $vendor)
    {
        $ledger = VendorLedger::where('vendor_id', $vendor->id)
            ->with(['vendorBill', 'voucher'])
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $balance = 0;
        foreach ($ledger as $entry) {
            $balance += $entry->credit - $entry->debit; // Credit (Bill) increases Liability, Debit (Payment) decreases it
            $entry->balance = $balance;
        }

        return response()->json($ledger);
    }
}
