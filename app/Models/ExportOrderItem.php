<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportOrderItem extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'export_order_id', 'product_id', 'quantity', 
        'unit_price', 'total_price', 'company_id'
    ];

    public function order()
    {
        return $this->belongsTo(ExportOrder::class, 'export_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
