<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Voucher;
use App\Models\Client;
use App\Services\ExchangeRateService;
use Carbon\Carbon;

class FinancialReportController extends Controller
{
    protected $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    public function dualCurrencyReport(Request $request, Client $client)
    {
        $invoices = Invoice::where('client_id', $client->id)->get();
        $vouchers = Voucher::where('client_id', $client->id)->get();

        $report = [
            'client' => $client->company_name,
            'home_currency' => 'PKR',
            'transactions' => []
        ];

        foreach ($invoices as $inv) {
            $report['transactions'][] = [
                'type' => 'Invoice',
                'number' => $inv->invoice_number,
                'date' => $inv->date,
                'amount' => $inv->total_amount,
                'currency' => $inv->currency,
                'base_amount' => $inv->base_amount,
                'exchange_rate' => $inv->exchange_rate
            ];
        }

        foreach ($vouchers as $vouch) {
            $report['transactions'][] = [
                'type' => 'Voucher (' . $vouch->type . ')',
                'number' => $vouch->voucher_number,
                'date' => $vouch->date,
                'amount' => $vouch->amount,
                'currency' => $vouch->currency,
                'base_amount' => $vouch->base_amount,
                'exchange_rate' => $vouch->exchange_rate
            ];
        }

        return response()->json($report);
    }

    public function exchangeGainLossReport(Request $request)
    {
        // For professional gain/loss, we compare Invoice rate vs Payment Voucher rate.
        // This is simplified: it looks at vouchers of type 'receipt' linked to clients.
        
        $receipts = Voucher::where('type', 'receipt')
            ->where('currency', '!=', 'PKR')
            ->get();

        $analysis = $receipts->map(function ($receipt) {
            // Find the invoice this might be paying (simplified: last invoice for client)
            $invoice = Invoice::where('client_id', $receipt->client_id)
                ->where('currency', $receipt->currency)
                ->where('date', '<=', $receipt->date)
                ->latest()
                ->first();

            if (!$invoice) return null;

            $openingRate = $invoice->exchange_rate;
            $closingRate = $receipt->exchange_rate;
            
            // Gain/Loss = Amount * (Closing Rate - Opening Rate)
            $gainLoss = $receipt->amount * ($closingRate - $openingRate);

            return [
                'receipt_number' => $receipt->voucher_number,
                'client' => $receipt->client->company_name ?? 'N/A',
                'invoice_reference' => $invoice->invoice_number,
                'amount_foreign' => $receipt->amount,
                'currency' => $receipt->currency,
                'invoice_rate' => $openingRate,
                'payment_rate' => $closingRate,
                'realized_gain_loss' => round($gainLoss, 2),
            ];
        })->filter();

        return response()->json([
            'total_gain_loss' => $analysis->sum('realized_gain_loss'),
            'details' => $analysis
        ]);
    }
}
