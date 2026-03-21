<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Role
{
    public function handle(Request $request, Closure $next, $role)
    {
        if (!Auth::guard('api')->check()) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication required'
            ], 401);
        }

        $user = Auth::guard('api')->user();
        
        if ($user->role !== $role) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'You do not have the required permissions to perform this action. Admin access required.'
            ], 403);
        }

        return $next($request);
    }
}