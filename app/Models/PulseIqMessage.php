<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PulseIqMessage extends Model
{
    protected $fillable = ['conversation_id', 'role', 'content'];

    public function conversation()
    {
        return $this->belongsTo(PulseIqConversation::class, 'conversation_id');
    }
}
