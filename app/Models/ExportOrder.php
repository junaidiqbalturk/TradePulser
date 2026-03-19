<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExportOrder extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'client_id',
        'tracking_number',
        'destination',
        'departure_date',
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
        return $this->hasMany(ExportOrderItem::class, 'export_order_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class, 'order_id')->where('type', 'export');
    }
}
