<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Illuminate\Support\Facades\Log; // Add this import

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

    /**
     * Register a new user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
     
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'role' => 'sometimes|in:admin,user',
            ]);
        
            // Fetch the current user using JWTAuth
            $currentUser = JWTAuth::parseToken()->authenticate();
        
            // Only existing admins can assign the 'admin' role
            if ($request->role === 'admin' && (!$currentUser || $currentUser->role !== 'admin')) {
                return response()->json(['error' => 'Unauthorized to assign admin role'], 403);
            }
        
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role' => $request->role ?? 'user',
            ]);
        
            return response()->json([
                'message' => 'User successfully registered',
                'user' => $user,
            ], 201);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only(['email', 'password']);

        try {
            // Replace auth()->attempt with JWTAuth::attempt
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['error' => 'Could not create token'], 500);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        try {
            $token = JWTAuth::getToken();
            if (!$token) {
                return response()->json(['error' => 'Token not provided'], 401);
            }
    
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 401);
            }
    
            return response()->json($user);
        } catch (JWTException $e) {
            Log::error('JWT Exception in me: ' . $e->getMessage());
            return response()->json(['error' => 'Unauthorized: ' . $e->getMessage()], 401);
        } catch (\Exception $e) {
            Log::error('General Exception in me: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        try {
            // Replace auth()->logout with JWTAuth::invalidate
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Successfully logged out']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Failed to logout: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        try {
            $token = JWTAuth::getToken();
            Log::info('Refresh token retrieved: ' . ($token ? $token : 'No token'));
            if (!$token) {
                return response()->json(['error' => 'Token not provided'], 401);
            }
    
            $user = JWTAuth::parseToken()->authenticate();
            Log::info('Authenticated user for refresh: ' . ($user ? $user->email : 'No user'));
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }
    
            $newToken = JWTAuth::refresh($token); // Explicitly pass the token
            Log::info('New token generated: ' . $newToken);
            return $this->respondWithToken($newToken);
        
        } catch (\Exception $e) {
            Log::error('General Exception in refresh: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }
    /**
     * Get the token array structure.
     *
     * @param  string $token
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60, // Replace auth()->factory()->getTTL with config('jwt.ttl')
            'user' => JWTAuth::user(), // Replace auth()->user with JWTAuth::user
        ]);
    }
}