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
            $table->foreignId('vendor_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
            $table->foreignId('vendor_bank_id')->nullable()->after('client_bank_id')->constrained('vendor_banks')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropForeign(['vendor_id']);
            $table->dropColumn('vendor_id');
            $table->dropForeign(['vendor_bank_id']);
            $table->dropColumn('vendor_bank_id');
        });
    }
};
