<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role', // Added for role-based authorization
         
    ];

    protected $hidden = [
        'password',
        'remember_token',
      
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function energyUsages()
    {
        return $this->hasMany(EnergyUsage::class);
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key-value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role, // Add the user's role to the token
        ];
    }
}