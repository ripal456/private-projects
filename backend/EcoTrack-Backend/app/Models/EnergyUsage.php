<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class EnergyUsage extends Model {
    protected $fillable = [
        'user_id',
        'energyUsage_id',
        'kwh_consumed',
        'date',
        'device_type',
        'location'
    ];

    // Define relationship with User model
    public function user() {
        return $this->belongsTo(User::class);
    }
}