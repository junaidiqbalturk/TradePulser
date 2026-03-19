<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ExchangeRateService
{
    protected $baseUrl = 'https://open.er-api.com/v6/latest/';

    /**
     * Get the exchange rate between two currencies for a specific date.
     * For now, it fetches latest and caches it for the date.
     */
    public function getRate($from, $to, $date = null, $force = false)
    {
        $date = $date ? Carbon::parse($date)->toDateString() : Carbon::today()->toDateString();

        // Check cache/database first (unless forced)
        if (!$force) {
            $cached = ExchangeRate::where('from_currency', $from)
                ->where('to_currency', $to)
                ->where('date', $date)
                ->first();

            if ($cached) {
                return $cached->rate;
            }
        }

        // Fetch from API (only if it's today or we don't have it)
        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout(5)->get($this->baseUrl . $from);
            if ($response->successful()) {
                $rates = $response->json()['rates'];
                if (isset($rates[$to])) {
                    $rate = $rates[$to];
                    
                    // Store in DB for caching
                    ExchangeRate::updateOrCreate(
                        ['from_currency' => $from, 'to_currency' => $to, 'date' => $date],
                        ['rate' => $rate]
                    );
                    
                    return $rate;
                }
            }
        } catch (\Exception $e) {
            Log::error("Exchange Rate API failure: " . $e->getMessage());
        }

        // Fallback for demo/testing if API fails
        if ($from === $to) return 1.0;
        if ($from === 'USD' && $to === 'PKR') return 280.00;
        if ($from === 'PKR' && $to === 'USD') return 0.00357;

        return 1.0;
    }

    public function convert($amount, $from, $to, $date = null)
    {
        if ($from === $to) return $amount;
        $rate = $this->getRate($from, $to, $date);
        return $amount * $rate;
    }
}
