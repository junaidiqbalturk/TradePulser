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
        Schema::create('import_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_order_id')->constrained()->onDelete('cascade');
            $table->string('product_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 2);
            $table->decimal('unit_price', 15, 2); // Purchase Price
            $table->decimal('weight', 15, 2)->default(0); // in kg
            $table->decimal('volume', 15, 2)->default(0); // in cbm
            $table->decimal('landed_unit_cost', 15, 2)->default(0); // Calculated
            $table->decimal('total_landed_cost', 15, 2)->default(0); // Calculated
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_order_items');
    }
};
