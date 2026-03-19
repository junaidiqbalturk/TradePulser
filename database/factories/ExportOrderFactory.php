<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExportOrder>
 */
class ExportOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => \App\Models\Client::factory(),
            'tracking_number' => 'EXP-' . $this->faker->unique()->numberBetween(10000, 99999),
            'destination' => $this->faker->country(),
            'departure_date' => $this->faker->dateTimeBetween('2025-01-01', '2026-04-01')->format('Y-m-d'),
            'status' => $this->faker->randomElement(['pending', 'shipped', 'delivered', 'customs']),
            'notes' => $this->faker->optional()->sentence(),
            'created_at' => $this->faker->dateTimeBetween('2025-01-01', '2026-03-10'),
            'updated_at' => now(),
        ];
    }
}
