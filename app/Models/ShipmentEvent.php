<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Shipment;

class ShipmentEvent extends Model
{
    use HasFactory, \App\Traits\Multitenant;

    protected $guarded = [];

    protected $casts = [
        'event_date' => 'datetime',
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}
