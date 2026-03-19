<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentTemplate extends Model
{
    use HasFactory, \App\Traits\Multitenant;

    protected $fillable = [
        'template_name',
        'document_type',
        'template_content',
        'is_default',
        'company_id',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
