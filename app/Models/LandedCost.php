<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandedCost extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'import_order_id', 'cost_category', 'amount', 
        'allocation_method', 'notes', 'company_id'
    ];

    public function order()
    {
        return $this->belongsTo(ImportOrder::class, 'import_order_id');
    }
}
