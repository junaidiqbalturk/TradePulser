<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pulse_iq_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('pulse_iq_conversations')->cascadeOnDelete();
            $table->enum('role', ['user', 'model', 'system', 'tool']);
            $table->longText('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pulse_iq_messages');
    }
};
