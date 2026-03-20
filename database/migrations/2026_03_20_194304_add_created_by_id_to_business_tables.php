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
        $tables = [
            'invoices',
            'vouchers',
            'purchase_orders',
            'shipments',
            'vendor_bills',
            'import_orders',
            'export_orders'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('created_by_id')->nullable()->constrained('users')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'invoices',
            'vouchers',
            'purchase_orders',
            'shipments',
            'vendor_bills',
            'import_orders',
            'export_orders'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropForeign($tableName . '_created_by_id_foreign'); // Fix naming
                $table->dropColumn('created_by_id');
            });
        }
    }
};
