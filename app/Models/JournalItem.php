<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalItem extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['journal_entry_id', 'account_id', 'debit', 'credit', 'notes', 'company_id'];

    public function entry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
