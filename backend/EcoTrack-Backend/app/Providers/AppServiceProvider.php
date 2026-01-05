<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    // ...

    public function boot()
    {
        $this->configureRateLimiting();

        parent::boot(); // 👈 Ensures routes are mapped
    }

    protected function mapApiRoutes()
    {
        Route::prefix('api')
            ->middleware('api')
            ->namespace($this->namespace)
            ->group(\base_path('routes/api.php'));
    }
    
    public function map() {
        $this->mapApiRoutes(); // 👈 Add this line
    }
    // ...
}