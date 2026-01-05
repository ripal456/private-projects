<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EnergyUsage;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Exception;

class EnergyUsageController extends Controller
{
    public function index()
    {
        try {
            $energyUsages = EnergyUsage::with('user')->get();
            return response()->json($energyUsages);
        } catch (Exception $e) {
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {

            $currentUser = JWTAuth::parseToken()->authenticate();

            if (!$currentUser || $currentUser->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized: Only admins can create energy usages'], 403);
            }

            $request->validate([
                'user_id' => 'required|exists:users,id',
                'kwh_consumed' => 'required|numeric',
                'date' => 'required|date',
                'device_type' => 'nullable|string',
                'location' => 'nullable|string',
            ]);

            $energyUsage = EnergyUsage::create($request->all());
            return response()->json($energyUsage, 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation Error', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $energyUsage = EnergyUsage::findOrFail($id);
            return response()->json($energyUsage);
        } catch (NotFoundHttpException $e) {
            return response()->json(['message' => 'Energy Usage not found'], 404);
        } catch (Exception $e) {
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $energyUsage = EnergyUsage::findOrFail($id);
            $energyUsage->update($request->all());
            return response()->json($energyUsage);
        } catch (NotFoundHttpException $e) {
            return response()->json(['message' => 'Energy Usage not found'], 404);
        } catch (Exception $e) {
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $energyUsage = EnergyUsage::findOrFail($id);
            $energyUsage->delete();
            return response()->json(null, 204);
        } catch (NotFoundHttpException $e) {
            return response()->json(['message' => 'Energy Usage not found'], 404);
        } catch (Exception $e) {
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }
}
