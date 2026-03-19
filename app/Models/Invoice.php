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
        'company_id',
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
}
