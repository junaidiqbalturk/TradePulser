<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExchangeRateService;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    public function current()
    {
        $rate = $this->exchangeRateService->getRate('USD', 'PKR');
        return response()->json([
            'from' => 'USD',
            'to' => 'PKR',
            'rate' => $rate,
            'date' => now()->toDateString()
        ]);
    }

    public function refresh()
    {
        $rate = $this->exchangeRateService->getRate('USD', 'PKR', null, true);
        return response()->json([
            'message' => 'Exchange rates refreshed successfully',
            'rate' => $rate,
            'date' => now()->toDateString()
        ]);
    }
}
