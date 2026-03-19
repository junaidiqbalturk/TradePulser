<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneratedDocument extends Model
{
    use HasFactory, \App\Traits\Multitenant;

    protected $fillable = [
        'document_number',
        'document_type',
        'reference_type',
        'reference_id',
        'file_path',
        'generated_by',
        'company_id',
    ];

    public function reference()
    {
        return $this->morphTo(null, 'reference_type', 'reference_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
