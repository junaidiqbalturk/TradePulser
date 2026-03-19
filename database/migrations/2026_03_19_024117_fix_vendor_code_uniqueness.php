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
        Schema::table('vendors', function (Blueprint $table) {
            // Drop the existing globally unique index
            $table->dropUnique(['vendor_code']);
            
            // Add a composite unique index for company_id and vendor_code
            $table->unique(['company_id', 'vendor_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'vendor_code']);
            $table->unique(['vendor_code']);
        });
    }
};
