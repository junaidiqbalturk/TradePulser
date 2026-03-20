<?php

namespace App\Http\Controllers;

use App\Models\VendorBill;
use App\Models\VendorLedger;
use App\Models\Vendor;
use App\Models\User;
use App\Notifications\AccountActivityNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class VendorBillController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $bills = VendorBill::with('vendor')->latest()->get();
        return response()->json($bills);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'bill_number' => 'required|string',
            'bill_date' => 'required|date',
            'due_date' => 'required|date',
            'currency' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0.01',
            'status' => 'nullable|in:unpaid,partial,paid',
        ]);

        DB::beginTransaction();
        try {
            // 1. Create the Vendor Bill
            $bill = VendorBill::create($validated);

            // 2. Fetch the current vendor balance
            $vendor = Vendor::findOrFail($validated['vendor_id']);
            $currentBalance = VendorLedger::where('vendor_id', $vendor->id)
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->value('balance') ?? 0;

            // 3. New Liability (Credit) increases balance owed
            $newBalance = $currentBalance + $validated['total_amount'];
            
            // 4. Create the Ledger Entry
            VendorLedger::create([
                'vendor_id' => $vendor->id,
                'vendor_bill_id' => $bill->id,
                'date' => $validated['bill_date'],
                'description' => "Supplier Bill: " . $validated['bill_number'],
                'debit' => 0,
                'credit' => $validated['total_amount'],
                'balance' => $newBalance
            ]);

            DB::commit();

            // Phase 1: Notify Admins
            $admins = User::where('company_id', $bill->company_id)
                ->whereHas('role', function ($query) {
                    $query->whereIn('name', ['Admin', 'Manager']);
                })->get();
            if ($admins->count() > 0) {
                Notification::send($admins, new AccountActivityNotification($bill, 'created', auth()->user()->name));
            }

            return response()->json($bill->load('vendor'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create vendor bill', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(VendorBill $vendorBill)
    {
        return response()->json($vendorBill->load(['vendor', 'ledger']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VendorBill $vendorBill)
    {
        $validated = $request->validate([
            'bill_number' => 'required|string',
            'bill_date' => 'required|date',
            'due_date' => 'required|date',
            'status' => 'required|in:unpaid,partial,paid',
        ]);

        $oldStatus = $vendorBill->status;
        $vendorBill->update($validated);

        // Phase 2: Notify Creator on payment
        if ($oldStatus !== $vendorBill->status && $vendorBill->status === 'paid') {
            if ($vendorBill->creator) {
                $vendorBill->creator->notify(new AccountActivityNotification($vendorBill, 'approved', auth()->user()->name));
            }
        }

        return response()->json($vendorBill);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VendorBill $vendorBill)
    {
        $vendorBill->delete();
        return response()->json(['message' => 'Vendor Bill deleted.']);
    }
}
