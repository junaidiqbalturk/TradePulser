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
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('shipment_number')->unique();
            $table->enum('type', ['import', 'export']);
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('origin_port')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('vessel_name')->nullable();
            $table->string('shipping_line')->nullable();
            $table->date('etd')->nullable();
            $table->date('eta')->nullable();
            $table->enum('status', ['Draft', 'Booked', 'In Transit', 'Arrived at Port', 'Customs Clearance', 'Delivered'])->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
