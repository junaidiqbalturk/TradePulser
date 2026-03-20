<?php

namespace App\Traits;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

trait Multitenant
{
    public static function bootMultitenant()
    {
        static::creating(function (Model $model) {
            if (auth()->check() && !$model->company_id) {
                $model->company_id = auth()->user()->company_id;
            }
        });

        static::addGlobalScope(new TenantScope);
    }
}
