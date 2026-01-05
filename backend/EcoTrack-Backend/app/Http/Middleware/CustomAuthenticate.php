<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomAuthenticate extends Middleware
{
    /**
     * Handle an unauthenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array  $guards
     * @return void
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    protected function unauthenticated($request, array $guards)
    {
        Log::info('CustomAuthenticate triggered for guards: ' . implode(', ', $guards));
        if ($request->expectsJson()) {
            Log::info('Returning 401 JSON response for API request');
            abort(response()->json(['error' => 'Unauthorized'], 401));
        }

        // Fall back to default behavior for non-API requests
        parent::unauthenticated($request, $guards);
    }
}