<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBill extends Model
{
    use \App\Traits\Multitenant;
    protected $guarded = [];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function ledger()
    {
        return $this->hasOne(VendorLedger::class);
    }
}
