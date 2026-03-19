<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ShipmentContainer;
use App\Models\ShipmentEvent;
use App\Models\ImportOrder;
use App\Models\ExportOrder;

class Shipment extends Model
{
    use HasFactory, \App\Traits\Multitenant;

    protected $guarded = [];

    protected $casts = [
        'etd' => 'date',
        'eta' => 'date',
    ];

    public function containers()
    {
        return $this->hasMany(ShipmentContainer::class);
    }

    public function events()
    {
        return $this->hasMany(ShipmentEvent::class)->orderBy('event_date', 'desc');
    }

    public function importOrder()
    {
        return $this->belongsTo(ImportOrder::class, 'order_id');
    }

    public function exportOrder()
    {
        return $this->belongsTo(ExportOrder::class, 'order_id');
    }
}
