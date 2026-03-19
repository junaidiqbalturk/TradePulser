<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBank extends Model
{
    use \App\Traits\Multitenant;
    protected $guarded = [];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
