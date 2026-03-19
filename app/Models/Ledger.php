<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ledger extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'client_id',
        'invoice_id',
        'voucher_id',
        'date',
        'description',
        'debit',
        'credit',
        'balance',
        'company_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }
}
