<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Ledger;
use App\Models\VendorLedger;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Services\ExchangeRateService;
use App\Services\AccountingService;

class VoucherController extends Controller
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
        return response()->json(Voucher::with(['client', 'clientBank', 'vendor', 'vendorBank'])->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'type' => 'required|in:cash,payment,receipt,journal',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'paid_to' => 'nullable|string',
            'currency' => 'nullable|string|max:3',
            'client_bank_id' => 'nullable|exists:client_banks,id',
            'vendor_bank_id' => 'nullable|exists:vendor_banks,id'
        ]);

        if (empty($validated['client_id']) && empty($validated['vendor_id'])) {
            return response()->json(['error' => 'Voucher must belong to either a client or a vendor.'], 422);
        }

        $prefixMap = [
            'cash' => 'CV-', 'payment' => 'PV-', 'receipt' => 'RV-', 'journal' => 'JV-'
        ];
        $voucherNumber = $prefixMap[$validated['type']] . strtoupper(uniqid());
        $validated['voucher_number'] = $voucherNumber;

        DB::beginTransaction();
        try {
            $currency = $validated['currency'] ?? 'PKR';
            $rate = $this->exchangeRateService->getRate($currency, 'PKR', $validated['date']);
            $baseAmount = $validated['amount'] * $rate;

            $validated['exchange_rate'] = $rate;
            $validated['base_amount'] = $baseAmount;
            $validated['currency'] = $currency;

            $voucher = Voucher::create($validated);
            $voucher->refresh(); // Load database defaults (like status = 'pending')

            // Posting logic is now handled centraly by AccountingService
            // Only post if it was somehow created with a non-pending status (future-proofing)
            if ($voucher->status !== 'pending') {
                $this->accountingService->postVoucher($voucher);
            }

            DB::commit();

            return response()->json($voucher->load(['client', 'clientBank', 'vendor', 'vendorBank']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Voucher $voucher)
    {
        return response()->json($voucher->load(['client', 'clientBank', 'vendor', 'vendorBank']));
    }

    public function update(Request $request, Voucher $voucher)
    {
        return response()->json(['message' => 'Update not fully implemented for vouchers in MVP'], 400);
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();
        return response()->json(['message' => 'Voucher deleted']);
    }
}
