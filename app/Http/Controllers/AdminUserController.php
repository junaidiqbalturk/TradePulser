<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Mail\UserInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AdminUserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('role')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|exists:roles,id'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'] ?? null,
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function invite(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role_id' => 'required|exists:roles,id',
            'password' => 'sometimes|string|min:8'
        ]);

        // If no password provided, generate a random one
        $password = $validated['password'] ?? bin2hex(random_bytes(4));

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role_id' => $validated['role_id'],
        ]);

        // Send invitation email
        Mail::to($user->email)->send(new UserInvitation($user, $password));

        return response()->json([
            'user' => $user->load('role'),
            'temp_password' => $password, // In a real app, send this via email
            'message' => 'User invited successfully'
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'nullable|exists:roles,id'
        ]);

        $user->update($validated);

        return response()->json($user->load('role'));
    }

    public function destroy(User $user)
    {
        if ($user->email === 'admin@tradepulser.com') {
            return response()->json(['message' => 'Cannot delete primary admin user'], 422);
        }
        $user->delete();
        return response()->json(null, 204);
    }
}
