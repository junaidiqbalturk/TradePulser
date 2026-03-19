<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use \App\Traits\Multitenant;
    protected $guarded = [];

    public function banks()
    {
        return $this->hasMany(VendorBank::class);
    }

    public function bills()
    {
        return $this->hasMany(VendorBill::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function ledgers()
    {
        return $this->hasMany(VendorLedger::class);
    }
}
