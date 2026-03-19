<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportOrderItem extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'import_order_id', 'product_id', 'product_name', 'description', 
        'quantity', 'unit_price', 'sales_price', 'weight', 'volume', 
        'landed_unit_cost', 'total_landed_cost', 'company_id'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(ImportOrder::class, 'import_order_id');
    }
}
