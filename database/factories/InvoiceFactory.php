<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invoice_number' => 'INV-' . $this->faker->unique()->randomNumber(8, true),
            'client_id' => \App\Models\Client::factory(),
            'date' => $this->faker->dateTimeBetween('2025-01-01', '2026-03-10')->format('Y-m-d'),
            'currency' => $this->faker->randomElement(['PKR', 'USD', 'EUR']),
            'total_amount' => $this->faker->randomFloat(2, 500, 50000),
            'discount' => 0,
            'tax' => 0,
        ];
    }
}
