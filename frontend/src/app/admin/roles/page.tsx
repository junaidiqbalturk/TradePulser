"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Shield, 
    Plus, 
    Edit, 
    Trash2, 
    CheckSquare, 
    Square, 
    Search,
    Lock,
    Users,
    ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Array<{ id: number; name: string }>;
}

interface Permission {
    id: number;
    name: string;
    module: string;
}

export default function RolesPage() {
    const { isAdmin } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const [roleForm, setRoleForm] = useState({
        name: "",
        description: "",
        permissions: [] as number[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get("/roles"),
                api.get("/roles/permissions")
            ]);
            setRoles(rolesRes.data);
            setAllPermissions(permsRes.data);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error(error);
                toast.error("Failed to load roles and permissions");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role);
            setRoleForm({
                name: role.name,
                description: role.description || "",
                permissions: role.permissions.map(p => p.id),
            });
        } else {
            setEditingRole(null);
            setRoleForm({
                name: "",
                description: "",
                permissions: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleTogglePermission = (id: number) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
    };

    const handleSubmit = async () => {
        if (!roleForm.name) return toast.error("Role name is required");

        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, roleForm);
                toast.success("Role updated successfully");
            } else {
                await api.post("/roles", roleForm);
                toast.success("Role created successfully");
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save role");
        }
    };

    const confirmDelete = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!roleToDelete) return;
        try {
            await api.delete(`/roles/${roleToDelete.id}`);
            toast.success("Role deleted");
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
            fetchData();
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error(error);
                toast.error("Failed to delete role");
            }
        }
    };

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (!isAdmin()) {
        return <div className="p-8 text-center">Unauthorized access. Admins only.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/settings" className="p-2 hover:bg-muted rounded-full group transition-colors">
                        <ChevronLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            Roles & Permissions
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Define user access levels and system capabilities.</p>
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog()} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Role
                </Button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[200px]">Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center p-8">Loading roles...</TableCell>
                            </TableRow>
                        ) : roles.map((role) => (
                            <TableRow key={role.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="font-bold text-foreground flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        {role.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-md">{role.description || 'No description'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5">
                                        {role.permissions.slice(0, 5).map(p => (
                                            <Badge key={p.id} variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/5 text-primary border-primary/10">
                                                {p.name.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                        {role.permissions.length > 5 && (
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                +{role.permissions.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => confirmDelete(role)} 
                                            disabled={role.name === 'Admin'}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card">
                    <DialogHeader className="p-6 pb-0 shrink-0">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <Shield className="h-6 w-6 text-primary" />
                            {editingRole ? "Edit Role" : "Create New Role"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase">Role Name</label>
                                <Input 
                                    placeholder="Enter role name (e.g., Accountant)" 
                                    value={roleForm.name}
                                    disabled={editingRole?.name === 'Admin'}
                                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-11 bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase">Description</label>
                                <Input 
                                    placeholder="Brief role description" 
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="h-11 bg-background"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-foreground">Assign Permissions</h3>
                                <div className="text-xs text-muted-foreground italic">Select granular capabilities for this role</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <div key={module} className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
                                        <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                            <CheckSquare className="h-3.5 w-3.5" />
                                            {module}
                                        </h4>
                                        <div className="space-y-2">
                                            {perms.map(perm => (
                                                <button
                                                    key={perm.id}
                                                    type="button"
                                                    onClick={() => handleTogglePermission(perm.id)}
                                                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background transition-colors text-left group"
                                                >
                                                    {roleForm.permissions.includes(perm.id) ? (
                                                        <CheckSquare className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    )}
                                                    <span className={`text-sm ${roleForm.permissions.includes(perm.id) ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                                        {perm.name.split('_').slice(1).join(' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border bg-muted/40 shrink-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} className="px-8 font-bold">
                            {editingRole ? "Update Role" : "Create Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deletion Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-6 pb-2 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">Remove System Role?</DialogTitle>
                        <p className="text-muted-foreground mt-2 text-sm text-center px-6">
                            Are you sure you want to remove the <span className="font-semibold text-foreground">{roleToDelete?.name}</span> role? This may affect users assigned to this role.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 bg-muted/30 flex gap-3 sm:flex-row flex-col-reverse">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-xl">
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete} 
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 shadow-sm"
                        >
                            Remove Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
