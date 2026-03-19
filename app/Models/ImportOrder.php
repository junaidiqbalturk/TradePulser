<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImportOrder extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'client_id',
        'purchase_order_id',
        'tracking_number',
        'origin',
        'expected_arrival',
        'status',
        'notes',
        'company_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(ImportOrderItem::class);
    }

    public function landedCosts()
    {
        return $this->hasMany(LandedCost::class, 'import_order_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class, 'order_id')->where('type', 'import');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
