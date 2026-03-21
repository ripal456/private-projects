<?php
namespace Database\Seeders;
use App\Models\EnergyUsage;
use Illuminate\Database\Seeder;

class EnergyUsageSeeder extends Seeder {
    public function run() {
        EnergyUsage::create([
            'user_id' => 1,
            'kwh_consumed' => 15.5,
            'date' => '2024-01-01',
            'device_type' => 'Solar Panel',
            'location' => 'Home',
        ]);

        EnergyUsage::create([
            'user_id' => 2,
            'kwh_consumed' => 10.2,
            'date' => '2024-01-02',
            'device_type' => 'Wind Turbine',
            'location' => 'Office',
        ]);
    }
}
