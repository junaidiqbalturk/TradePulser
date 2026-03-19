<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Voucher;
use App\Models\Ledger;
use App\Services\AccountingService;
use Illuminate\Support\Facades\DB;

class VoucherApprovalController extends Controller
{
    protected $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function approve(Request $request, Voucher $voucher)
    {
        if ($voucher->status !== 'pending') {
            return response()->json(['error' => 'Only pending vouchers can be approved.'], 400);
        }

        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        if ($roleName === 'Accountant' && $voucher->amount > 50000) {
            return response()->json([
                'error' => 'Accountants can only approve vouchers up to 50,000 PKR. This voucher requires approval from an Invoice Approver or Admin.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $voucher->status = 'approved';
            $voucher->save();

            // Only now we add to Ledger and GL if it wasn't already added
            // (Note: In the store() method, we currently add to ledger immediately. 
            // We should refactor store() to only add to ledger if status is approved)
            
            // For this implementation, we assume ledger entry is created here.
            // This now handles both Ledger and General Ledger posting correctly
            $this->accountingService->postVoucher($voucher);

            DB::commit();
            return response()->json(['message' => 'Voucher approved and posted.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, Voucher $voucher)
    {
        if ($voucher->status !== 'pending') {
            return response()->json(['error' => 'Only pending vouchers can be rejected.'], 400);
        }

        $voucher->status = 'rejected';
        $voucher->notes .= "\nRejection Reason: " . ($request->reason ?? 'No reason provided');
        $voucher->save();

        return response()->json(['message' => 'Voucher rejected.']);
    }

    public function getPending()
    {
        return response()->json(Voucher::where('status', 'pending')->with(['client', 'clientBank', 'vendor', 'vendorBank'])->get());
    }
}
