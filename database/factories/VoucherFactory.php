<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Voucher>
 */
class VoucherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'voucher_number' => 'VCH-' . $this->faker->unique()->randomNumber(8, true),
            'client_id' => \App\Models\Client::factory(),
            'type' => $this->faker->randomElement(['receipt', 'payment', 'cash', 'journal']),
            'date' => $this->faker->dateTimeBetween('2025-01-01', '2026-03-10')->format('Y-m-d'),
            'amount' => $amount = $this->faker->randomFloat(2, 100, 100000),
            'currency' => 'PKR',
            'exchange_rate' => 1.0,
            'base_amount' => $amount,
            'payment_method' => $this->faker->randomElement(['cash', 'bank']),
            'reference' => $this->faker->optional()->word(),
            'notes' => $this->faker->optional()->sentence(),
            'paid_to' => null,
            'client_bank_id' => null,
        ];
    }
}
