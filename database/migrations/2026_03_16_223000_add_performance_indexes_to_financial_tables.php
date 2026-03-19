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
        Schema::table('vouchers', function (Blueprint $table) {
            $table->index('type');
            $table->index('date');
            $table->index('status');
        });

        Schema::table('ledgers', function (Blueprint $table) {
            $table->index('date');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index('date');
            $table->index('status');
        });

        Schema::table('import_orders', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('export_orders', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['date']);
            $table->dropIndex(['status']);
        });

        Schema::table('ledgers', function (Blueprint $table) {
            $table->dropIndex(['date']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['date']);
            $table->dropIndex(['status']);
        });

        Schema::table('import_orders', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('export_orders', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
    }
};
