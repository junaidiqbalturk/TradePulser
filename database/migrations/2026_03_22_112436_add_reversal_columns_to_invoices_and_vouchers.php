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
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('reversal_requested_by_id')->nullable()->constrained('users');
            $table->foreignId('reversal_approved_by_id')->nullable()->constrained('users');
            $table->text('reversal_reason')->nullable();
            $table->timestamp('reversal_requested_at')->nullable();
            $table->timestamp('reversal_approved_at')->nullable();
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->foreignId('reversal_requested_by_id')->nullable()->constrained('users');
            $table->foreignId('reversal_approved_by_id')->nullable()->constrained('users');
            $table->text('reversal_reason')->nullable();
            $table->timestamp('reversal_requested_at')->nullable();
            $table->timestamp('reversal_approved_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['reversal_requested_by_id', 'reversal_approved_by_id', 'reversal_reason', 'reversal_requested_at', 'reversal_approved_at']);
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['reversal_requested_by_id', 'reversal_approved_by_id', 'reversal_reason', 'reversal_requested_at', 'reversal_approved_at']);
        });
    }
};
