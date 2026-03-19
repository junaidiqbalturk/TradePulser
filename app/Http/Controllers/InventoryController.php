<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function getStockOverview()
    {
        $stocks = InventoryStock::with(['product', 'warehouse'])->get();
        return response()->json($stocks);
    }

    public function getTransactionHistory()
    {
        $transactions = InventoryTransaction::with(['product', 'warehouse', 'reference'])->latest()->get();
        return response()->json($transactions);
    }
}
