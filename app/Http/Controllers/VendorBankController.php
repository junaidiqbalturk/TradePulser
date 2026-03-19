<?php

namespace App\Http\Controllers;

use App\Models\VendorBank;
use Illuminate\Http\Request;

class VendorBankController extends Controller
{
    public function index(Request $request, $vendor_id)
    {
        return response()->json(VendorBank::where('vendor_id', $vendor_id)->get());
    }

    public function store(Request $request, $vendor_id)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string',
            'account_title' => 'required|string',
            'account_number' => 'required|string',
            'iban' => 'nullable|string',
            'swift_code' => 'nullable|string',
            'currency' => 'nullable|string'
        ]);

        $validated['vendor_id'] = $vendor_id;
        $bank = VendorBank::create($validated);

        return response()->json($bank, 201);
    }

    public function show(VendorBank $bank)
    {
        return response()->json($bank);
    }

    public function update(Request $request, VendorBank $bank)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string',
            'account_title' => 'required|string',
            'account_number' => 'required|string',
            'iban' => 'nullable|string',
            'swift_code' => 'nullable|string',
            'currency' => 'nullable|string'
        ]);

        $bank->update($validated);
        return response()->json($bank);
    }

    public function destroy(VendorBank $bank)
    {
        $bank->delete();
        return response()->json(['message' => 'Bank deleted']);
    }
}
