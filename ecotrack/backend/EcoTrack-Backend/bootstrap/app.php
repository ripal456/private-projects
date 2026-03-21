<?php

use App\Http\Middleware\Role;
use App\Http\Middleware\CustomAuthenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Tymon\JWTAuth\Exceptions\JWTException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class, // Correct middleware
        ]);
        
        $middleware->alias([
            'auth:api' => CustomAuthenticate::class, // Explicitly override auth:api
            'role' => Role::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (JWTException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized: ' . $e->getMessage()], 401);
            }
            throw $e;
        });
        $exceptions->render(function (Symfony\Component\Routing\Exception\RouteNotFoundException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            throw $e;
        });
    })->create();