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
    protected $tables = [
        'users', 'clients', 'vendors', 'products', 'warehouses', 
        'inventory_stocks', 'inventory_transactions', 'import_orders', 
        'export_orders', 'shipments', 'documents', 'invoices', 'vouchers', 
        'ledgers', 'purchase_orders', 'vendor_bills', 'vendor_ledgers', 
        'accounts', 'journal_entries', 'journal_items', 'invoice_items', 
        'import_order_items', 'export_order_items', 'purchase_order_items', 
        'landed_costs', 'payment_reconciliations', 'document_templates', 
        'generated_documents', 'shipment_containers', 'shipment_events', 
        'recurring_expenses', 'client_banks', 'vendor_banks'
    ];

    public function up(): void
    {
        // 1. Create a default company first to satisfy foreign key constraints
        DB::table('companies')->insertOrIgnore([
            'id' => 1,
            'company_name' => 'Main Company',
            'email' => 'admin@tradepulser.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Add company_id to all tables
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('company_id')->default(1)->after('id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (array_reverse($this->tables) as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->dropForeign([$tableName . '_company_id_foreign']);
                    $table->dropColumn('company_id');
                });
            }
        }
    }
};
