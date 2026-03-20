<?php

namespace App\Traits;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

trait Multitenant
{
    public static function bootMultitenant()
    {
        static::creating(function (Model $model) {
            if (app()->runningInConsole() && !app()->runningUnitTests()) {
                return;
            }

            $user = auth()->user();
            if ($user && $user->company_id && !$model->company_id) {
                $model->company_id = $user->company_id;
            }
        });

        static::addGlobalScope(new \App\Scopes\TenantScope);
    }
}
