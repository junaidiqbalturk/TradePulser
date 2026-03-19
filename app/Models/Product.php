<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['name', 'sku', 'description', 'unit_cost', 'unit', 'company_id'];

    public function inventoryStocks()
    {
        return $this->hasMany(InventoryStock::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function importOrderItems()
    {
        return $this->hasMany(ImportOrderItem::class);
    }

    public function exportOrderItems()
    {
        return $this->hasMany(ExportOrderItem::class);
    }
}
