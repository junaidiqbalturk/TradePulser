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
        // For Invoices
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'paid', 'partially_paid', 'reversal_pending', 'reversed') DEFAULT 'pending'");
        
        // For Vouchers
        DB::statement("ALTER TABLE vouchers MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'rejected', 'posted', 'reversal_pending', 'reversed') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert Invoices
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'paid', 'partially_paid') DEFAULT 'pending'");
        
        // Revert Vouchers
        DB::statement("ALTER TABLE vouchers MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'rejected', 'posted') DEFAULT 'pending'");
    }
};
