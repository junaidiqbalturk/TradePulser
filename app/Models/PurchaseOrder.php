<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory, \App\Traits\Multitenant;

    protected $fillable = [
        'po_number',
        'vendor_id',
        'order_date',
        'expected_delivery',
        'currency',
        'total_amount',
        'status',
        'created_by_id',
        'notes',
        'company_id',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function importOrders()
    {
        return $this->hasMany(ImportOrder::class);
    }

    public function vendorBills()
    {
        return $this->hasMany(VendorBill::class);
    }

    // Helper to calculate total
    public function calculateTotal()
    {
        return $this->items()->sum('total_price');
    }
}
