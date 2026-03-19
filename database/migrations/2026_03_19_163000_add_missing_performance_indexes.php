<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'clients' => ['company_name', 'email'],
            'vendors' => ['company_name', 'email'],
            'products' => ['name', 'sku'],
            'invoice_items' => ['item_name'],
            'import_order_items' => ['product_name'],
            'vendor_bills' => ['bill_number', 'status'],
            'vouchers' => ['reference'],
            'shipments' => ['status', 'type', 'etd', 'eta'],
        ];

        foreach ($tables as $tableName => $columns) {
            foreach ($columns as $column) {
                $indexName = "{$tableName}_{$column}_index";
                $exists = count(DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName])) > 0;
                
                if (!$exists) {
                    Schema::table($tableName, function (Blueprint $table) use ($column) {
                        $table->index($column);
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['company_name']);
            $table->dropIndex(['email']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropIndex(['company_name']);
            $table->dropIndex(['email']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['sku']);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropIndex(['item_name']);
        });

        Schema::table('import_order_items', function (Blueprint $table) {
            $table->dropIndex(['product_name']);
        });

        Schema::table('vendor_bills', function (Blueprint $table) {
            $table->dropIndex(['bill_number']);
            $table->dropIndex(['status']);
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropIndex(['reference']);
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['type']);
            $table->dropIndex(['etd']);
            $table->dropIndex(['eta']);
        });
    }
};
