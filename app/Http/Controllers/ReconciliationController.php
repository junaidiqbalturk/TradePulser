<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Voucher;
use App\Models\PaymentReconciliation;
use Illuminate\Support\Facades\DB;

class ReconciliationController extends Controller
{
    /**
     * Match a receipt voucher to one or more invoices.
     */
    public function match(Request $request)
    {
        $validated = $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
            'matches' => 'required|array|min:1',
            'matches.*.invoice_id' => 'required|exists:invoices,id',
            'matches.*.amount' => 'required|numeric|min:0.01',
        ]);

        $voucher = Voucher::findOrFail($validated['voucher_id']);
        
        if ($voucher->type !== 'receipt') {
            return response()->json(['error' => 'Only receipt vouchers can be reconciled.'], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($validated['matches'] as $match) {
                PaymentReconciliation::create([
                    'voucher_id' => $voucher->id,
                    'invoice_id' => $match['invoice_id'],
                    'amount_allocated' => $match['amount'],
                ]);

                $this->updateInvoiceStatus($match['invoice_id']);
            }

            DB::commit();
            return response()->json(['message' => 'Reconciliation successful']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function updateInvoiceStatus($invoiceId)
    {
        $invoice = Invoice::with('items')->findOrFail($invoiceId);
        $totalPaid = PaymentReconciliation::where('invoice_id', $invoiceId)->sum('amount_allocated');
        
        if ($totalPaid >= $invoice->total_amount) {
            $invoice->status = 'paid';
        } elseif ($totalPaid > 0) {
            $invoice->status = 'partially_paid';
        } else {
            $invoice->status = 'unpaid';
        }
        
        $invoice->save();
    }

    public function getUnreconciledVouchers()
    {
        // Vouchers of type receipt that aren't fully allocated
        $vouchers = Voucher::where('type', 'receipt')
            ->with('client')
            ->get()
            ->filter(function ($v) {
                $allocated = PaymentReconciliation::where('voucher_id', $v->id)->sum('amount_allocated');
                return $allocated < $v->amount;
            });

        return response()->json($vouchers->values());
    }

    public function getOutstandingInvoices(Request $request)
    {
        $query = Invoice::whereIn('status', ['unpaid', 'partially_paid'])->with('client');
        
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        return response()->json($query->get());
    }
}
