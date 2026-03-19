<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\Voucher;

class VendorLedger extends Model
{
    use \App\Traits\Multitenant;
    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }
}
