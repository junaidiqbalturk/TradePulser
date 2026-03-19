<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\VendorBank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Load with the latest balance from the ledger
        $vendors = Vendor::addSelect([
            'total_balance' => \App\Models\VendorLedger::selectRaw('SUM(credit) - SUM(debit)')
                ->whereColumn('vendor_id', 'vendors.id')
        ])->latest()->get();
        
        return response()->json($vendors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_code' => 'required|string|unique:vendors,vendor_code',
            'company_name' => 'required|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'country' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'currency' => 'nullable|string',
            'banks' => 'nullable|array',
            'banks.*.bank_name' => 'required|string',
            'banks.*.account_title' => 'required|string',
            'banks.*.account_number' => 'required|string',
            'banks.*.iban' => 'nullable|string',
            'banks.*.swift_code' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $vendor = Vendor::create(collect($validated)->except('banks')->toArray());

            if (!empty($validated['banks'])) {
                foreach ($validated['banks'] as $bankData) {
                    $vendor->banks()->create($bankData);
                }
            }

            DB::commit();
            return response()->json($vendor->load('banks'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create vendor', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Vendor $vendor)
    {
        $vendor->total_balance = \App\Models\VendorLedger::where('vendor_id', $vendor->id)
            ->selectRaw('SUM(credit) - SUM(debit) as balance')
            ->value('balance') ?? 0;

        // Load relationships needed for profile view
        return response()->json($vendor->load(['banks', 'bills' => function($q) {
            $q->latest();
        }]));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vendor $vendor)
    {
        $validated = $request->validate([
            'vendor_code' => 'required|string|unique:vendors,vendor_code,' . $vendor->id,
            'company_name' => 'required|string',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'country' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'currency' => 'nullable|string',
        ]);

        $vendor->update($validated);
        return response()->json($vendor);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vendor $vendor)
    {
        // DB handles cascading deletes, but we can do logic here
        $vendor->delete();
        return response()->json(['message' => 'Vendor deleted successfully.']);
    }
}
