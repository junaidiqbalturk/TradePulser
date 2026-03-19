<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class InvoiceItem extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'invoice_id',
        'item_name',
        'qty',
        'price',
        'total',
        'company_id',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
