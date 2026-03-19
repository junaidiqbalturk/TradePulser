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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_number')->unique();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['cash', 'payment', 'receipt', 'journal']);
            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['cash', 'bank']);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->string('paid_to')->nullable();
            $table->foreignId('client_bank_id')->nullable()->constrained('client_banks')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
