<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use \App\Traits\Multitenant;
    protected $fillable = [
        'documentable_type',
        'documentable_id',
        'user_id',
        'type',
        'file_name',
        'original_name',
        'mime_type',
        'size',
        'file_path',
        'company_id',
    ];

    public function documentable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
