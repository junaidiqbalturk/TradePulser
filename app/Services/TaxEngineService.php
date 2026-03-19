<?php

namespace App\Services;

class TaxEngineService
{
    /**
     * Calculate tax for various types.
     */
    public function calculate($amount, $taxType, $country = 'PK')
    {
        $rates = [
            'PK' => [
                'GST' => 0.18,
                'WHT_SERVICES' => 0.10,
                'CUSTOMS' => 0.20,
            ],
            'AE' => [
                'VAT' => 0.05,
            ],
            'UK' => [
                'VAT' => 0.20,
            ]
        ];

        $rate = $rates[$country][$taxType] ?? 0;
        $taxAmount = $amount * $rate;

        return [
            'base_amount' => $amount,
            'tax_rate' => $rate,
            'tax_amount' => round($taxAmount, 2),
            'total_amount' => round($amount + $taxAmount, 2),
            'description' => "$taxType ($rate%)"
        ];
    }
}
