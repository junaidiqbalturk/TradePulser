<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecurringExpense extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['company_id'];
}
