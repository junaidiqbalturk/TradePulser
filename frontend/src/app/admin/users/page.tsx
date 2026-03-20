"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Users, 
    Plus, 
    Edit, 
    Trash2, 
    Mail, 
    ShieldCheck, 
    Search,
    UserCircle,
    ChevronLeft,
    Shield
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    role: Role | null;
}

export default function UsersManagementPage() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        role_id: "" as string,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get("/admin/users"),
                api.get("/roles")
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error(error);
                toast.error("Failed to load users and roles");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (user: User | null = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                name: user.name,
                email: user.email,
                password: "", // Don't show password for editing
                role_id: user.role_id?.toString() || "",
            });
        } else {
            setEditingUser(null);
            setUserForm({
                name: "",
                email: "",
                password: "",
                role_id: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!userForm.name || !userForm.email) return toast.error("Name and Email are required");
        if (!editingUser && !userForm.password) return toast.error("Password is required for new users");

        try {
            if (editingUser) {
                const { password, ...updateData } = userForm;
                await api.put(`/admin/users/${editingUser.id}`, updateData);
                toast.success("User updated successfully");
            } else {
                const submitData = {
                    ...userForm,
                    role_id: userForm.role_id === "" ? null : userForm.role_id
                };
                await api.post("/admin/users", submitData);
                toast.success("User created successfully");
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0] as string[];
                toast.error(firstError[0] || "Validation failed");
            } else if (error.response?.status !== 401) {
                console.error(error);
                toast.error(error.response?.data?.message || "Failed to save user");
            }
        }
    };

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/admin/users/${userToDelete.id}`);
            toast.success("User deleted");
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchData();
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error(error);
                toast.error("Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <Users className="h-8 w-8 text-primary" />
                            User Management
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage team members and their roles.</p>
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog()} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                </Button>
            </div>

            <div className="flex items-center gap-3 max-w-md bg-card border border-border px-3 py-2 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                />
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Assigned Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-8">Loading users...</TableCell>
                            </TableRow>
                        ) : filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/5">
                                        {user.name.charAt(0)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold text-foreground">{user.name}</div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        {user.email}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.role ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 flex items-center gap-1.5 w-fit">
                                            <ShieldCheck className="h-3 w-3" />
                                            {user.role.name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">No Role Assigned</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => confirmDelete(user)} 
                                            disabled={user.email === 'admin@tradepulser.com'}
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
                <DialogContent className="sm:max-w-[500px] border-border bg-card p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <UserCircle className="h-6 w-6 text-primary" />
                            {editingUser ? "Edit User Account" : "Add New User"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                            <Input 
                                placeholder="E.g. John Doe" 
                                value={userForm.name}
                                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                                className="h-11 bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                            <Input 
                                type="email"
                                placeholder="john@example.com" 
                                value={userForm.email}
                                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                className="h-11 bg-background"
                            />
                        </div>
                        
                        {!editingUser && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Temporary Password</label>
                                <Input 
                                    type="password"
                                    placeholder="Min. 8 characters" 
                                    value={userForm.password}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="h-11 bg-background"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" />
                                Assign System Role
                            </label>
                            <Select 
                                value={userForm.role_id} 
                                onValueChange={(value) => setUserForm(prev => ({ ...prev, role_id: value }))}
                            >
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">Roles determine user's visibility and action rights in the system.</p>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border bg-muted/40 gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">Cancel</Button>
                        <Button onClick={handleSubmit} className="px-8 font-bold shadow-sm">
                            {editingUser ? "Save Changes" : "Create Account"}
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
                        <DialogTitle className="text-xl font-bold text-foreground">Remove Team Member?</DialogTitle>
                        <p className="text-muted-foreground mt-2 text-sm text-center px-6">
                            Are you sure you want to remove <span className="font-semibold text-foreground">{userToDelete?.name}</span>? This action cannot be undone and they will lose all access.
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
                            Remove Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
