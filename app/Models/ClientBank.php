<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientBank extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'client_id',
        'bank_name',
        'account_title',
        'account_number',
        'iban',
        'swift_code',
        'currency',
        'company_id',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
