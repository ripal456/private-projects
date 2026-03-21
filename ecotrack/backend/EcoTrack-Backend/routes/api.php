<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EnergyUsageController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;

Route::prefix('eco-track')->group(function () {
    // Authentication Routes
    Route::post('/register', [AuthController::class, 'register'])->middleware('api');
    Route::post('/login', [AuthController::class, 'login'])->middleware('api');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:api');

    // Energy Usage Routes (Protected by auth only)
    Route::middleware('auth:api')->group(function () {
        Route::post('/energy-usages', [EnergyUsageController::class, 'store']);
        Route::get('/energy-usages', [EnergyUsageController::class, 'index']);
        Route::get('/energy-usages/{id}', [EnergyUsageController::class, 'show']);
    });

    // User Routes
    Route::middleware('auth:api')->group(function () {
        // Routes accessible to all authenticated users
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);

        // Admin-only routes with role middleware
        Route::middleware('role:admin')->group(function () {
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });
    });
});

// Global exception handler for route not found
Route::fallback(function () {
    return response()->json([
        'error' => 'Not Found',
        'message' => 'The requested resource was not found on the server'
    ], 404);
});