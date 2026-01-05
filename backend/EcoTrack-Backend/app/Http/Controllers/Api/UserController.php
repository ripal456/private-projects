<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    // Read all users
    public function index()
    {
        try {
            $currentUser = auth()->guard('api')->user();
            $isAdmin = $currentUser && $currentUser->role === 'admin';

            $users = User::with('energyUsages')->get();

            $filteredUsers = $users->map(function ($user) use ($isAdmin) {
                if ($user->role === 'admin' && !$isAdmin) {
                    return null;
                }

                $energyUsages = $user->energyUsages->map(function ($energyUsage) {
                    return [
                        'energyUsage_id' => $energyUsage->id,
                        'kwh_consumed' => $energyUsage->kwh_consumed,
                        'date' => $energyUsage->date,
                        'device_type' => $energyUsage->device_type,
                        'location' => $energyUsage->location
                    ];
                });

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'energy_usages' => $energyUsages
                ];
            })->filter()->values();

            return response()->json($filteredUsers, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    // Create a new user
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            return response()->json($user, 201);
        } catch (QueryException $e) {
            return response()->json(['error' => 'Email already exists'], 409);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    // Read a single user
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);
            return response()->json($user);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'User not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    // Update a user
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:6',
            ]);

            $user = User::findOrFail($id);
            $user->update([
                'name' => $request->name ?? $user->name,
                'email' => $request->email ?? $user->email,
                'password' => $request->password ? Hash::make($request->password) : $user->password,
            ]);

            return response()->json($user);
        } catch (QueryException $e) {
            return response()->json(['error' => 'Email already exists'], 409);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'User not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    // Delete a user
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();
            return response()->json(null, 204);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'User not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }
}

// Similar error handling will be applied in EnergyUsageController methods using the same approach as UserController.
