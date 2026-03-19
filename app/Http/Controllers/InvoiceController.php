<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Services\ExchangeRateService;
use App\Services\AccountingService;

class InvoiceController extends Controller
{
    protected $exchangeRateService;
    protected $accountingService;

    public function __construct(ExchangeRateService $exchangeRateService, AccountingService $accountingService)
    {
        $this->exchangeRateService = $exchangeRateService;
        $this->accountingService = $accountingService;
    }
    public function index()
    {
        return response()->json(Invoice::with(['client', 'items'])->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'date' => 'required|date',
            'currency' => 'nullable|string',
            'discount' => 'nullable|numeric',
            'tax' => 'nullable|numeric',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        // Generate Invoice Number
        $invoiceNumber = 'INV-' . strtoupper(uniqid());

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['qty'] * $item['price'];
            }
            $totalAmount += ($validated['tax'] ?? 0) - ($validated['discount'] ?? 0);

            $currency = $validated['currency'] ?? 'PKR';
            $rate = $this->exchangeRateService->getRate($currency, 'PKR', $validated['date']);
            $baseAmount = $totalAmount * $rate;

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'client_id' => $validated['client_id'],
                'date' => $validated['date'],
                'currency' => $currency,
                'exchange_rate' => $rate,
                'base_amount' => $baseAmount,
                'discount' => $validated['discount'] ?? 0,
                'tax' => $validated['tax'] ?? 0,
                'total_amount' => $totalAmount,
                'status' => 'pending'
            ]);

            foreach ($validated['items'] as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'item_name' => $item['item_name'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'total' => $item['qty'] * $item['price'],
                ]);
            }

            // We skip auto-posting here if it's pending.
            // If the user wants auto-approval for small amounts, we can add it here.
            $user = $request->user();
            $roleName = $user->role ? $user->role->name : null;

            if ($roleName === 'Admin' || $roleName === 'Invoice Approver' || ($roleName === 'Accountant' && $invoice->total_amount <= 50000)) {
                $invoice->status = 'approved';
                $invoice->save();

                // Client owes money (Debit to Ledger)
                Ledger::create([
                    'client_id' => $invoice->client_id,
                    'invoice_id' => $invoice->id,
                    'date' => $invoice->date,
                    'description' => 'Invoice ' . $invoice->invoice_number,
                    'debit' => $invoice->total_amount,
                    'credit' => 0,
                ]);

                // Auto-Post to General Ledger (Module 4)
                $this->accountingService->autoPostInvoice($invoice);
            }

            DB::commit();

            return response()->json($invoice->load('items', 'client'), 201);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load('items', 'client'));
    }

    public function update(Request $request, Invoice $invoice)
    {
        // For MVP, updating invoices might be complex due to ledger syncing. 
        // We will allow just basic fields. Usually, invoices aren't fully editable.
        return response()->json(['message' => 'Update not fully implemented for invoices in MVP'], 400);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete(); // Cascades items and ledger entries if configured
        return response()->json(['message' => 'Invoice deleted']);
    }

    public function approve(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'pending') {
            return response()->json(['error' => 'Only pending invoices can be approved.'], 400);
        }

        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        if ($roleName === 'Accountant' && $invoice->total_amount > 50000) {
            return response()->json([
                'error' => 'Accountants can only approve invoices up to 50,000 PKR. This invoice requires approval from an Invoice Approver or Admin.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $invoice->status = 'approved';
            $invoice->save();

            // Client owes money (Debit to Ledger)
            Ledger::create([
                'client_id' => $invoice->client_id,
                'invoice_id' => $invoice->id,
                'date' => $invoice->date,
                'description' => 'Invoice ' . $invoice->invoice_number,
                'debit' => $invoice->total_amount,
                'credit' => 0,
            ]);

            // Auto-Post to General Ledger (Module 4)
            $this->accountingService->autoPostInvoice($invoice);

            DB::commit();
            return response()->json(['message' => 'Invoice approved and posted.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'pending') {
            return response()->json(['error' => 'Only pending invoices can be rejected.'], 400);
        }

        $invoice->status = 'rejected';
        $invoice->save();

        return response()->json(['message' => 'Invoice rejected.']);
    }
}
