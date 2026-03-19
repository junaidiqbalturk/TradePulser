<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['code', 'name', 'type', 'is_active', 'company_id'];

    public function items()
    {
        return $this->hasMany(JournalItem::class);
    }
}
