<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Define Permissions
        $permissions = [
            // Clients
            ['name' => 'view_clients', 'module' => 'clients'],
            ['name' => 'create_clients', 'module' => 'clients'],
            ['name' => 'edit_clients', 'module' => 'clients'],
            ['name' => 'delete_clients', 'module' => 'clients'],
            
            // Invoices
            ['name' => 'view_invoices', 'module' => 'invoices'],
            ['name' => 'create_invoices', 'module' => 'invoices'],
            ['name' => 'edit_invoices', 'module' => 'invoices'],
            ['name' => 'delete_invoices', 'module' => 'invoices'],
            ['name' => 'approve_invoices', 'module' => 'invoices'],
            
            // Vouchers
            ['name' => 'view_vouchers', 'module' => 'vouchers'],
            ['name' => 'create_vouchers', 'module' => 'vouchers'],
            ['name' => 'edit_vouchers', 'module' => 'vouchers'],
            ['name' => 'delete_vouchers', 'module' => 'vouchers'],
            ['name' => 'approve_vouchers', 'module' => 'vouchers'],
            
            // Inventory
            ['name' => 'view_inventory', 'module' => 'inventory'],
            ['name' => 'update_inventory', 'module' => 'inventory'],
            
            // Procurement
            ['name' => 'view_pos', 'module' => 'procurement'],
            ['name' => 'create_pos', 'module' => 'procurement'],
            ['name' => 'approve_pos', 'module' => 'procurement'],
            
            // Admin
            ['name' => 'manage_roles', 'module' => 'admin'],
            ['name' => 'manage_users', 'module' => 'admin'],

            // Documents
            ['name' => 'view_documents', 'module' => 'documents'],
            ['name' => 'create_documents', 'module' => 'documents'],
            ['name' => 'manage_documents', 'module' => 'documents'],
            ['name' => 'delete_documents', 'module' => 'documents'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['name' => $p['name']], $p);
        }

        // 2. Define Roles and Assign Permissions
        $roles = [
            'Admin' => ['description' => 'Full system access', 'permissions' => Permission::all()->pluck('name')->toArray()],
            'Accountant' => [
                'description' => 'Accounting and finance management', 
                'permissions' => ['view_vouchers', 'create_vouchers', 'view_invoices', 'create_invoices', 'view_clients', 'approve_vouchers', 'approve_invoices']
            ],
            'Invoice Approver' => [
                'description' => 'High-value approval authority',
                'permissions' => ['view_invoices', 'approve_invoices', 'view_vouchers', 'approve_vouchers', 'view_pos', 'approve_pos']
            ],
            'Procurement Officer' => [
                'description' => 'Manages purchase orders and vendors',
                'permissions' => ['view_pos', 'create_pos', 'view_inventory']
            ],
            'Sales Manager' => [
                'description' => 'Manages clients and sales orders',
                'permissions' => ['view_clients', 'create_clients', 'edit_clients', 'view_invoices', 'create_invoices']
            ],
            'Warehouse Manager' => [
                'description' => 'Manages stock and inventory',
                'permissions' => ['view_inventory', 'update_inventory']
            ],
            'Viewer' => [
                'description' => 'Read-only access',
                'permissions' => ['view_clients', 'view_invoices', 'view_vouchers', 'view_inventory', 'view_pos']
            ],
        ];

        foreach ($roles as $roleName => $data) {
            $role = Role::updateOrCreate(['name' => $roleName], ['description' => $data['description']]);
            $permissionIds = Permission::whereIn('name', $data['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        // 3. Assign Admin role to existing admin user
        $adminRole = Role::where('name', 'Admin')->first();
        $adminUser = User::where('email', 'admin@tradepulser.com')->first();
        if ($adminUser && $adminRole) {
            $adminUser->update(['role_id' => $adminRole->id]);
        }
    }
}
