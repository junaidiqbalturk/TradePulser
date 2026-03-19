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
            $table->decimal('exchange_rate', 15, 6)->default(1)->after('currency');
            $table->decimal('base_amount', 15, 2)->default(0)->after('exchange_rate'); // PKR amount
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('currency', 3)->default('PKR')->after('amount');
            $table->decimal('exchange_rate', 15, 6)->default(1)->after('currency');
            $table->decimal('base_amount', 15, 2)->default(0)->after('exchange_rate'); // PKR amount
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'base_amount']);
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate', 'base_amount']);
        });
    }
};
