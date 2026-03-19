<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'company_id' => 'required|exists:companies,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'company_id' => $request->company_id,
        ]);

        // Assign default Viewer role if no role is logic is present
        $viewerRole = Role::where('name', 'Viewer')->first();
        if ($viewerRole) {
            $user->update(['role_id' => $viewerRole->id]);
        }

        $user->load(['role.permissions', 'company']);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('auth_token')->plainTextToken
        ]);
    }

    public function registerCompany(Request $request)
    {
        $request->validate([
            // Company info
            'company_name' => 'required|string|max:255',
            'company_email' => 'required|string|email|max:255|unique:companies,email',
            'currency' => 'required|string|max:3',
            // User info (Admin)
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'industry' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Create Company
            $company = Company::create([
                'company_name' => $request->company_name,
                'email' => $request->company_email,
                'currency' => $request->currency,
                'industry' => $request->industry,
            ]);

            // 2. Find Admin Role
            $adminRole = Role::where('name', 'Admin')->first();

            // 3. Create First User (Admin)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'company_id' => $company->id,
                'role_id' => $adminRole ? $adminRole->id : null,
            ]);

            // 4. Seed Demo Data
            $demoService = new \App\Services\DemoDataService();
            $demoService->seed($company);

            $user->load(['role.permissions', 'company']);

            return response()->json([
                'user' => $user,
                'company' => $company,
                'token' => $user->createToken('auth_token')->plainTextToken
            ]);
        });
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->load(['role.permissions', 'company']);

        return response()->json([
            'user' => $user,
            'company' => $user->company,
            'token' => $user->createToken('auth_token')->plainTextToken
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function completeOnboarding(Request $request)
    {
        $user = $request->user();
        $user->update(['has_completed_onboarding' => 1]);

        return response()->json([
            'message' => 'Onboarding status updated successfully',
            'user' => $user->load(['role.permissions', 'company'])
        ]);
    }
}
