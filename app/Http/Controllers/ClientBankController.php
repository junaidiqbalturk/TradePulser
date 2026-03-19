<?php

namespace App\Http\Controllers;

use App\Models\ClientBank;
use Illuminate\Http\Request;

class ClientBankController extends Controller
{
    public function index(Request $request, $client_id)
    {
        return response()->json(ClientBank::where('client_id', $client_id)->get());
    }

    public function store(Request $request, $client_id)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string',
            'account_title' => 'required|string',
            'account_number' => 'required|string',
            'iban' => 'nullable|string',
            'swift_code' => 'nullable|string',
            'currency' => 'nullable|string'
        ]);

        $validated['client_id'] = $client_id;
        $bank = ClientBank::create($validated);

        return response()->json($bank, 201);
    }

    public function show(ClientBank $bank)
    {
        return response()->json($bank);
    }

    public function update(Request $request, ClientBank $bank)
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

    public function destroy(ClientBank $bank)
    {
        $bank->delete();
        return response()->json(['message' => 'Bank deleted']);
    }
}
