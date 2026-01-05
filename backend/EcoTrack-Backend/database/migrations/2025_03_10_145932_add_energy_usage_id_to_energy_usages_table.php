<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEnergyUsageIdToEnergyUsagesTable extends Migration
{
    public function up()
    {
        Schema::table('energy_usages', function (Blueprint $table) {
            $table->unsignedBigInteger('energyUsage_id')->nullable()->after('id'); // Add energyUsage_id column
        });
    }

    public function down()
    {
        Schema::table('energy_usages', function (Blueprint $table) {
            $table->dropColumn('energyUsage_id'); // Drop the column if rolling back
        });
    }
}