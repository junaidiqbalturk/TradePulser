<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Voucher extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'voucher_number',
        'client_id',
        'vendor_id',
        'type',
        'date',
        'amount',
        'currency',
        'exchange_rate',
        'base_amount',
        'status',
        'rejection_reason',
        'payment_method',
        'reference',
        'notes',
        'paid_to',
        'client_bank_id',
        'vendor_bank_id',
        'created_by_id',
        'company_id',
        'reversal_requested_by_id',
        'reversal_approved_by_id',
        'reversal_reason',
        'reversal_requested_at',
        'reversal_approved_at',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function clientBank()
    {
        return $this->belongsTo(ClientBank::class, 'client_bank_id');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function vendorBank()
    {
        return $this->belongsTo(VendorBank::class);
    }

    public function ledgers()
    {
        return $this->hasMany(Ledger::class);
    }

    public function reconciliations()
    {
        return $this->hasMany(PaymentReconciliation::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function reversalRequester()
    {
        return $this->belongsTo(User::class, 'reversal_requested_by_id');
    }

    public function reversalApprover()
    {
        return $this->belongsTo(User::class, 'reversal_approved_by_id');
    }
}
