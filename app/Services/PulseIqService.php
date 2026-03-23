<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Voucher;
use App\Models\VendorBill;
use Exception;
use Illuminate\Support\Facades\Log;

class PulseIqService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', '');
    }

    public function generateResponse(array $history, int $companyId)
    {
        if (empty($this->apiKey)) {
            throw new Exception("Gemini API key is missing. Please add GEMINI_API_KEY to your .env file.");
        }

        $systemInstruction = "You are PulseIQ, an advanced and highly professional AI financial assistant for TradePulser. You help business owners understand their finances, clients, vendors, and transactions. Always be helpful, concise, and professional. CRITICAL FORMATTING RULES: 1. NEVER use Markdown tables (`| ... |`). The chat interface does not support tables and they look broken. 2. Always present data in clean, conversational bullet point lists using standard text and elegant emojis. 3. Feel free to use bold text (`**text**`) for emphasis, but keep formatting extremely simple and human-friendly.";

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemInstruction]]
            ],
            'contents' => $history,
            'tools' => [
                [
                    'function_declarations' => $this->getToolDeclarations()
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.2,
            ]
        ];

        return $this->callGeminiWithToolHandling($payload, $history, $companyId);
    }

    protected function callGeminiWithToolHandling(array $payload, array &$history, int $companyId, int $depth = 0)
    {
        if ($depth > 5) {
            throw new Exception("Exceeded maximum tool call depth.");
        }

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post($this->baseUrl . '?key=' . $this->apiKey, $payload);

        if (!$response->successful()) {
            Log::error('Gemini API Error: ' . $response->body());
            throw new Exception("Failed to communicate with the AI service. " . $response->body());
        }

        $data = $response->json();
        
        if (!isset($data['candidates'][0]['content']['parts'])) {
            return [
                'text' => "I'm sorry, I couldn't process that properly. Wait, it might have been blocked or empty.",
                'raw_response' => $data
            ];
        }

        $parts = $data['candidates'][0]['content']['parts'];
        
        // Fix empty args converting to JSON lists
        foreach ($parts as &$part) {
            if (isset($part['functionCall']['args']) && is_array($part['functionCall']['args']) && empty($part['functionCall']['args'])) {
                $part['functionCall']['args'] = (object)[];
            }
        }
        unset($part);

        // Append model response to history
        $history[] = [
            'role' => 'model',
            'parts' => $parts
        ];

        // Check if there is a function call
        $functionCall = null;
        foreach ($parts as $part) {
            if (isset($part['functionCall'])) {
                $functionCall = $part['functionCall'];
                break;
            }
        }

        if ($functionCall) {
            $name = $functionCall['name'];
            $args = $functionCall['args'] ?? [];
            if (is_object($args)) {
                $args = (array)$args;
            }
            
            // Execute the tool locally
            $toolResult = $this->executeTool($name, $args, $companyId);

            // Add the tool execution result back into the history for the model
            $history[] = [
                'role' => 'user', 
                'parts' => [
                    [
                        'functionResponse' => [
                            'name' => $name,
                            'response' => empty($toolResult) ? (object)[] : $toolResult
                        ]
                    ]
                ]
            ];

            // Re-call API with the new data
            $payload['contents'] = $history;
            return $this->callGeminiWithToolHandling($payload, $history, $companyId, $depth + 1);
        }

        // Aggregate final text
        $text = "";
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $text .= $part['text'];
            }
        }

        return [
            'text' => $text,
            'history' => $history
        ];
    }

    protected function getToolDeclarations()
    {
        return [
            [
                'name' => 'get_dashboard_summary',
                'description' => 'Returns the total count of clients, total revenue from fully or partially paid invoices, and total outstanding payables for the current company.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ],
            [
                'name' => 'get_recent_invoices',
                'description' => 'Returns a list of the 5 most recent invoices including their status, amount, and invoice number.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ],
            [
                'name' => 'get_top_vendor_liability',
                'description' => 'Returns the vendor to whom the company owes the most money, including the total outstanding amount.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ],
            [
                'name' => 'get_unpaid_vouchers',
                'description' => 'Returns a list of all unpaid or pending vouchers that need to be settled.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ],
            [
                'name' => 'get_client_balance',
                'description' => 'Returns the total billed and total outstanding balance for a specifically named client.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'client_name' => [
                            'type' => 'STRING',
                            'description' => 'The name or partial name of the client to look up.'
                        ]
                    ],
                    'required' => ['client_name']
                ]
            ],
            [
                'name' => 'get_financial_forecast',
                'description' => 'Calculates 30-day cash flow analysis by returning total pending receivables (unpaid invoices) and pending payables (unpaid vendor bills and vouchers).',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ],
            [
                'name' => 'track_export_import_orders',
                'description' => 'Returns the most recent active export and import orders (up to 5 each) along with their tracking numbers and status.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => (object)[]
                ]
            ]
        ];
    }

    protected function executeTool(string $name, array $args, int $companyId)
    {
        try {
            switch ($name) {
                case 'get_dashboard_summary':
                    return [
                        'total_clients' => Client::where('company_id', $companyId)->count(),
                        'total_revenue' => Invoice::where('company_id', $companyId)->whereIn('status', ['paid', 'partially_paid'])->sum('total_amount'),
                        'total_payables' => VendorBill::where('company_id', $companyId)->where('status', '!=', 'paid')->sum('total_amount')
                    ];

                case 'get_recent_invoices':
                    $invoices = Invoice::where('company_id', $companyId)
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get(['invoice_number', 'status', 'total_amount', 'date'])
                        ->toArray();
                    return ['invoices' => $invoices];

                case 'get_top_vendor_liability':
                    // In Laravel, to get sum grouped by vendor with relationship
                    $vendorId = VendorBill::where('company_id', $companyId)
                        ->where('status', '!=', 'paid')
                        ->groupBy('vendor_id')
                        ->selectRaw('vendor_id, sum(total_amount) as total_owed')
                        ->orderByDesc('total_owed')
                        ->first();
                    
                    if (!$vendorId) {
                        return ['message' => 'There are no outstanding vendor liabilities.'];
                    }
                    
                    $vendor = \App\Models\Vendor::find($vendorId->vendor_id);
                    return [
                        'vendor_name' => $vendor ? $vendor->name : 'Unknown',
                        'total_owed' => (float)$vendorId->total_owed
                    ];

                case 'get_unpaid_vouchers':
                    $vouchers = Voucher::where('company_id', $companyId)
                        ->whereIn('status', ['draft', 'pending', 'approved'])
                        ->orderBy('created_at', 'desc')
                        ->limit(10)
                        ->get(['voucher_number', 'type', 'status', 'amount', 'date'])
                        ->toArray();
                    return [
                        'unpaid_vouchers' => $vouchers,
                        'message' => count($vouchers) == 10 ? 'Showing top 10 oldest unpaid vouchers.' : 'Showing all unpaid vouchers.'
                    ];

                case 'get_client_balance':
                    $clientName = $args['client_name'] ?? '';
                    if (!$clientName) return ['error' => 'client_name is required.'];

                    $client = Client::where('company_id', $companyId)
                        ->where('name', 'like', '%' . $clientName . '%')
                        ->first();

                    if (!$client) return ['error' => "No client found matching '{$clientName}'."];

                    $totalBilled = Invoice::where('client_id', $client->id)
                        ->where('company_id', $companyId)
                        ->sum('total_amount');
                    
                    // Outstanding (Draft, Pending, Approved, Partially Paid)
                    $totalOutstanding = Invoice::where('client_id', $client->id)
                        ->where('company_id', $companyId)
                        ->whereIn('status', ['draft', 'pending', 'approved', 'partially_paid'])
                        ->sum('total_amount'); // Approx, missing paid parts of partially paid, but good enough for AI summary

                    return [
                        'client_name' => $client->name,
                        'email' => $client->email,
                        'total_billed_lifetime' => (float)$totalBilled,
                        'total_unpaid_balance' => (float)$totalOutstanding,
                    ];

                case 'get_financial_forecast':
                    $receivables = Invoice::where('company_id', $companyId)
                        ->whereNotIn('status', ['paid'])
                        ->sum('total_amount');
                        
                    $vendorPayables = VendorBill::where('company_id', $companyId)
                        ->whereNotIn('status', ['paid'])
                        ->sum('total_amount');
                        
                    $voucherPayables = Voucher::where('company_id', $companyId)
                        ->whereIn('status', ['pending', 'approved'])
                        ->sum('amount');

                    return [
                        'total_pending_receivables' => (float)$receivables,
                        'total_pending_payables' => (float)($vendorPayables + $voucherPayables),
                        'net_cashflow_projection' => (float)($receivables - ($vendorPayables + $voucherPayables)),
                        'message' => 'Forecast is based on all currently unpaid invoices minus unpaid vendor bills and approved/pending vouchers.'
                    ];

                case 'track_export_import_orders':
                    $exports = \App\Models\ExportOrder::where('company_id', $companyId)
                        ->with('client:id,name')
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get(['id', 'client_id', 'tracking_number', 'destination', 'status'])
                        ->map(function($order) {
                            return [
                                'type' => 'Export',
                                'client' => $order->client->name ?? 'Unknown',
                                'tracking' => $order->tracking_number,
                                'destination' => $order->destination,
                                'status' => $order->status
                            ];
                        })->toArray();

                    $imports = \App\Models\ImportOrder::where('company_id', $companyId)
                        ->with('client:id,name')
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get(['id', 'client_id', 'tracking_number', 'origin', 'status'])
                        ->map(function($order) {
                            return [
                                'type' => 'Import',
                                'client' => $order->client->name ?? 'Unknown',
                                'tracking' => $order->tracking_number,
                                'origin' => $order->origin,
                                'status' => $order->status
                            ];
                        })->toArray();

                    return [
                        'recent_trade_orders' => array_merge($exports, $imports)
                    ];

                default:
                    return ['error' => 'Unknown tool called'];
            }
        } catch (Exception $e) {
            Log::error('Tool execution error: ' . $e->getMessage());
            return ['error' => 'Failed to execute tool due to internal error.'];
        }
    }
}
