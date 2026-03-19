<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentReconciliation extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = ['voucher_id', 'invoice_id', 'amount_allocated', 'company_id'];
}
