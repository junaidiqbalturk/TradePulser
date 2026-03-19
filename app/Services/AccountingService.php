<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Invoice;
use App\Models\Voucher;
use App\Models\Ledger;
use App\Models\VendorLedger;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    public function createJournalEntry($date, $description, $reference, array $items)
    {
        $totalDebit = collect($items)->sum('debit');
        $totalCredit = collect($items)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \Exception("Journal Entry is not balanced. Debit: $totalDebit, Credit: $totalCredit");
        }

        // Check if period is locked (simplified: check if any locked entry exists for that date or later)
        $isLocked = JournalEntry::where('date', $date)->where('status', 'locked')->exists();
        if ($isLocked) {
            throw new \Exception("Cannot post to a locked fiscal period.");
        }

        return DB::transaction(function () use ($date, $description, $reference, $items) {
            $entry = JournalEntry::create([
                'date' => $date,
                'description' => $description,
                'reference' => $reference,
                'status' => 'posted'
            ]);

            foreach ($items as $item) {
                $entry->items()->create([
                    'account_id' => $item['account_id'],
                    'debit' => $item['debit'] ?? 0,
                    'credit' => $item['credit'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $entry;
        });
    }

    public function autoPostInvoice(Invoice $invoice)
    {
        // 1. Debit Accounts Receivable (Asset)
        // 2. Credit Sales Revenue (Revenue)
        
        $arAccount = Account::where('code', '1200')->first(); // Accounts Receivable
        $salesAccount = Account::where('code', '4000')->first(); // Sales Revenue

        if (!$arAccount || !$salesAccount) return null;

        return $this->createJournalEntry(
            $invoice->date,
            "Sales Invoice: " . $invoice->invoice_number,
            $invoice->invoice_number,
            [
                ['account_id' => $arAccount->id, 'debit' => $invoice->base_amount, 'credit' => 0],
                ['account_id' => $salesAccount->id, 'debit' => 0, 'credit' => $invoice->base_amount],
            ]
        );
    }

    public function postVoucher(Voucher $voucher)
    {
        // Avoid duplicate posting
        if ($voucher->status === 'posted') {
            return;
        }

        return DB::transaction(function () use ($voucher) {
            // 1. Handle Client Ledger
            if ($voucher->client_id) {
                $debit = 0;
                $credit = 0;

                if (in_array($voucher->type, ['payment'])) {
                    $debit = $voucher->amount;
                } else if ($voucher->type === 'receipt') {
                    $credit = $voucher->amount;
                }

                if ($debit > 0 || $credit > 0) {
                    $clientCurrentBalance = Ledger::where('client_id', $voucher->client_id)
                        ->orderBy('date', 'desc')
                        ->orderBy('id', 'desc')
                        ->value('balance') ?? 0;
                    
                    $clientNewBalance = $clientCurrentBalance + $debit - $credit;

                    Ledger::create([
                        'client_id' => $voucher->client_id,
                        'voucher_id' => $voucher->id,
                        'date' => $voucher->date,
                        'description' => ucfirst($voucher->type) . ' Voucher ' . $voucher->voucher_number,
                        'debit' => $debit,
                        'credit' => $credit,
                        'balance' => $clientNewBalance
                    ]);
                }
            }

            // 2. Handle Vendor Ledger
            if ($voucher->vendor_id && $voucher->type === 'payment') {
                $vendorCurrentBalance = VendorLedger::where('vendor_id', $voucher->vendor_id)
                    ->orderBy('date', 'desc')
                    ->orderBy('id', 'desc')
                    ->value('balance') ?? 0;

                $vendorNewBalance = $vendorCurrentBalance - $voucher->amount;

                VendorLedger::create([
                    'vendor_id' => $voucher->vendor_id,
                    'voucher_id' => $voucher->id,
                    'date' => $voucher->date,
                    'description' => 'Payment Voucher ' . $voucher->voucher_number,
                    'debit' => $voucher->amount,
                    'credit' => 0,
                    'balance' => $vendorNewBalance
                ]);
            }

            // 3. Auto-Post to General Ledger (Module 4)
            // Check if already posted to GL to avoid unique constraint error
            $alreadyPostedToGL = JournalEntry::where('reference', $voucher->voucher_number)->exists();
            if (!$alreadyPostedToGL) {
                $this->autoPostVoucher($voucher);
            }

            // 4. Update status to posted
            $voucher->status = 'posted';
            $voucher->save();
        });
    }

    public function autoPostVoucher(Voucher $voucher)
    {
        if ($voucher->type === 'receipt') {
            // Receipt: Debit Bank/Cash, Credit Accounts Receivable
            $cashAccount = $voucher->payment_method === 'cash' 
                ? Account::where('code', '1000')->first() 
                : Account::where('code', '1100')->first();
            
            $arAccount = Account::where('code', '1200')->first();

            if (!$cashAccount || !$arAccount) return null;

            return $this->createJournalEntry(
                $voucher->date,
                "Payment Receipt: " . $voucher->voucher_number,
                $voucher->voucher_number,
                [
                    ['account_id' => $cashAccount->id, 'debit' => $voucher->base_amount, 'credit' => 0],
                    ['account_id' => $arAccount->id, 'debit' => 0, 'credit' => $voucher->base_amount],
                ]
            );
        }
        
        if ($voucher->type === 'payment') {
            // Payment: Debit Accounts Payable, Credit Bank/Cash
            $cashAccount = $voucher->payment_method === 'cash' 
                ? Account::where('code', '1000')->first() 
                : Account::where('code', '1100')->first();
            
            $apAccount = Account::where('code', '2000')->first(); // Accounts Payable

            if (!$cashAccount || !$apAccount) return null;

            return $this->createJournalEntry(
                $voucher->date,
                "Vendor Payment: " . $voucher->voucher_number,
                $voucher->voucher_number,
                [
                    ['account_id' => $apAccount->id, 'debit' => $voucher->base_amount, 'credit' => 0],
                    ['account_id' => $cashAccount->id, 'debit' => 0, 'credit' => $voucher->base_amount],
                ]
            );
        }

        if ($voucher->type === 'cash') {
            // Cash Voucher: Typically an expense or internal transfer. 
            // Simplified: Debit Office Rent (5400) if no other info, Credit Petty Cash (1000)
            $cashAccount = Account::where('code', '1000')->first();
            $expenseAccount = Account::where('code', '5400')->first();

            if (!$cashAccount || !$expenseAccount) return null;

            return $this->createJournalEntry(
                $voucher->date,
                "Cash Expense: " . $voucher->voucher_number,
                $voucher->voucher_number,
                [
                    ['account_id' => $expenseAccount->id, 'debit' => $voucher->base_amount, 'credit' => 0],
                    ['account_id' => $cashAccount->id, 'debit' => 0, 'credit' => $voucher->base_amount],
                ]
            );
        }

        return null;
    }
}
