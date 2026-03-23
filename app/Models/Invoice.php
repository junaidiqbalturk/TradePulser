<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Invoice extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'invoice_number',
        'client_id',
        'date',
        'currency',
        'exchange_rate',
        'base_amount',
        'total_amount',
        'discount',
        'tax',
        'status',
        'rejection_reason',
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

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function ledgers()
    {
        return $this->hasMany(Ledger::class);
    }

    public function reconciliations()
    {
        return $this->hasMany(PaymentReconciliation::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
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
