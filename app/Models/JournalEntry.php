<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['date', 'description', 'reference', 'status', 'company_id'];

    public function items()
    {
        return $this->hasMany(JournalItem::class);
    }
}
