<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Invoice;
use App\Models\Voucher;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Notifications\AccountActivityNotification;
use Illuminate\Support\Facades\Notification;

class ReversalController extends Controller
{
    protected $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Get all pending reversal requests for the company.
     */
    public function pendingReversals(Request $request)
    {
        $companyId = auth()->user()->company_id;

        $invoices = Invoice::where('company_id', $companyId)
            ->where('status', 'reversal_pending')
            ->with(['client', 'reversalRequester'])
            ->get()
            ->map(function ($item) {
                $item->type = 'invoice';
                return $item;
            });

        $vouchers = Voucher::where('company_id', $companyId)
            ->where('status', 'reversal_pending')
            ->with(['client', 'vendor', 'reversalRequester'])
            ->get()
            ->map(function ($item) {
                $item->type = 'voucher';
                return $item;
            });

        return response()->json([
            'invoices' => $invoices,
            'vouchers' => $vouchers,
            'all' => $invoices->concat($vouchers)->sortByDesc('reversal_requested_at')->values()
        ]);
    }

    /**
     * Request a reversal for an invoice or voucher.
     */
    public function requestReversal(Request $request, $type, $id)
    {
        $request->validate([
            'reason' => 'required|string|min:5|max:500'
        ]);

        try {
            $companyId = auth()->user()->company_id;
            $model = $this->getModel($type, $id, $companyId);
            
            if (!$model) {
                return response()->json(['error' => 'Record not found or access denied.'], 404);
            }

            // Only approved/processed transactions can be reversed
            // Added 'approved' for vouchers specifically
            $validStatuses = ['approved', 'partially_paid', 'paid', 'posted'];
            if (!in_array($model->status, $validStatuses)) {
                return response()->json(['error' => "Current status '{$model->status}' cannot be reversed. Only fully processed transactions are eligible."], 400);
            }

            $model->status = 'reversal_pending';
            $model->reversal_reason = $request->reason;
            $model->reversal_requested_by_id = auth()->id();
            $model->reversal_requested_at = now();
            $model->save();

            // Notify supervisors
            $approvers = User::where('company_id', $companyId)
                ->whereHas('role.permissions', function ($query) {
                    $query->where('name', 'approve_reversal');
                })->get();

            if ($approvers->count() > 0) {
                Notification::send($approvers, new AccountActivityNotification($model, 'reversal_requested', auth()->user()->name));
            }

            return response()->json(['message' => 'Reversal request submitted for approval.', 'data' => $model]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Approve a reversal request (Two-Eye Principle).
     */
    public function approveReversal(Request $request, $type, $id)
    {
        try {
            $companyId = auth()->user()->company_id;
            $model = $this->getModel($type, $id, $companyId);

            if (!$model || $model->status !== 'reversal_pending') {
                return response()->json(['error' => 'Invalid or already processed reversal request.'], 400);
            }

            // Two-Eye Principle: Approver cannot be the requester
            if ($model->reversal_requested_by_id === auth()->id()) {
                return response()->json(['error' => 'Two-Eye Principle violation: You cannot approve a reversal that you initiated.'], 403);
            }

            if ($type === 'invoice') {
                $this->accountingService->executeInvoiceReversal($model, auth()->id());
            } else {
                $this->accountingService->executeVoucherReversal($model, auth()->id());
            }

            // Notify requester
            if ($model->reversalRequester) {
                $model->reversalRequester->notify(new AccountActivityNotification($model, 'reversal_approved', auth()->user()->name));
            }

            return response()->json(['message' => 'Reversal approved and entries successfully posted.', 'data' => $model->refresh()]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a reversal request.
     */
    public function rejectReversal(Request $request, $type, $id)
    {
        $companyId = auth()->user()->company_id;
        $model = $this->getModel($type, $id, $companyId);

        if (!$model || $model->status !== 'reversal_pending') {
            return response()->json(['error' => 'Invalid reversal request.'], 400);
        }

        // Restore original status
        // For simple logic, we return to 'approved' for invoice or 'posted' for voucher
        // In a more complex system, we'd store the 'pre_reversal_status'
        $model->status = ($type === 'invoice') ? 'approved' : 'posted';
        $model->reversal_reason = null;
        $model->reversal_requested_by_id = null;
        $model->reversal_requested_at = null;
        $model->save();

        // Notify requester
        if ($model->reversalRequester) {
            $model->reversalRequester->notify(new AccountActivityNotification($model, 'reversal_rejected', auth()->user()->name));
        }

        return response()->json(['message' => 'Reversal request rejected.', 'data' => $model]);
    }

    protected function getModel($type, $id, $companyId)
    {
        if ($type === 'invoice') {
            return Invoice::where('id', $id)->where('company_id', $companyId)->first();
        } elseif ($type === 'voucher') {
            return Voucher::where('id', $id)->where('company_id', $companyId)->first();
        }
        return null;
    }
}
