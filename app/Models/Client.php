<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Model
{
    use HasFactory, \App\Traits\Multitenant;
    protected $fillable = [
        'company_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'country',
        'notes',
        'company_id',
    ];

    public function banks()
    {
        return $this->hasMany(ClientBank::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function ledgers()
    {
        return $this->hasMany(Ledger::class);
    }

    public function importOrders()
    {
        return $this->hasMany(ImportOrder::class);
    }

    public function exportOrders()
    {
        return $this->hasMany(ExportOrder::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
