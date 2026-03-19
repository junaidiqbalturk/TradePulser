"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building, Shield, Bell, Globe, RefreshCcw, ShieldCheck, UserCog, ExternalLink, FileText, Camera, Palette, Plus, Mail, Trash2, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Company {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    country?: string;
    currency: string;
    logo_path?: string;
    settings?: {
        primary_color?: string;
        secondary_color?: string;
    }
}

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role?: {
        name: string;
    };
    role_id?: number;
}

interface Role {
    id: number;
    name: string;
}

export default function SettingsPage() {
    const { user, isAdmin, updateUser } = useAuth();
    const [rate, setRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [companyLoading, setCompanyLoading] = useState(true);
    const [company, setCompany] = useState<Company | null>(null);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isTeamLoading, setIsTeamLoading] = useState(true);
    
    // Invitation Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: "",
        email: "",
        role_id: "",
    });

    // Deletion Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRate();
        fetchCompany();
        if (isAdmin()) {
            fetchTeam();
            fetchRoles();
        }
    }, [isAdmin]);

    const fetchCompany = async () => {
        try {
            const res = await api.get('/company');
            setCompany(res.data);
        } catch (error: any) {
            if (error.response?.status !== 401) toast.error("Failed to load company data");
        } finally {
            setCompanyLoading(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await api.get('/admin/users');
            setTeam(res.data);
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsTeamLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error: any) {
            console.error(error);
        }
    };

    const fetchRate = async () => {
        try {
            const res = await api.get('/exchange-rates/current');
            setRate(res.data.rate);
        } catch (error: any) {
            console.error("Failed to fetch rate:", error);
        }
    };

    const handleColorSelect = (primary: string, secondary: string) => {
        if (!company) return;
        
        // Immediate visual feedback
        document.documentElement.style.setProperty("--primary", primary);
        document.documentElement.style.setProperty("--ring", primary);
        document.documentElement.style.setProperty("--accent", primary);
        document.documentElement.style.setProperty("--secondary", secondary);

        setCompany({
            ...company,
            settings: {
                ...company.settings,
                primary_color: primary,
                secondary_color: secondary
            }
        });
    };

    const colorPresets = [
        { primary: "#3C50E0", secondary: "#80CAEE", name: "Default Blue" },
        { primary: "#10b981", secondary: "#34d399", name: "Emerald Green" },
        { primary: "#f59e0b", secondary: "#fbbf24", name: "Amber Orange" },
        { primary: "#e11d48", secondary: "#fb7185", name: "Rose Red" },
        { primary: "#7c3aed", secondary: "#a78bfa", name: "Violet Purple" },
        { primary: "#0f172a", secondary: "#334155", name: "Slate Dark" },
    ];

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await api.post('/exchange-rates/refresh');
            if (res.data && res.data.rate !== undefined) {
                setRate(res.data.rate);
                alert("Exchange rates refreshed successfully!");
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error: any) {
            console.error("Refresh error:", error);
            alert("Failed to refresh exchange rates. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        setLoading(true);
        try {
            const res = await api.post('/company/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCompany(prev => prev ? { ...prev, logo_path: res.data.path } : null);
            toast.success("Logo updated successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Logo upload failed");
        } finally {
            if (user) {
                // Refresh user context to show new logo elsewhere
                api.get('/user').then(res => updateUser(res.data));
            }
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        if (!company) return;
        setLoading(true);
        try {
            await api.put('/company', company);
            toast.success("Company settings saved!");
        } catch (error: any) {
            if (error.response?.status !== 401) toast.error("Failed to save company settings");
        } finally {
            if (user) {
                // Refresh user context to apply theme globally
                api.get('/user').then(res => updateUser(res.data));
            }
            setLoading(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteForm.name || !inviteForm.email || !inviteForm.role_id) {
            return toast.error("Please fill all fields");
        }

        setLoading(true);
        try {
            const res = await api.post('/admin/users/invite', inviteForm);
            setTeam(prev => [...prev, res.data.user]);
            setIsInviteModalOpen(false);
            setInviteForm({ name: "", email: "", role_id: "" });
            toast.success(`User invited! Temp Password: ${res.data.temp_password}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invitation failed");
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteMember = (member: TeamMember) => {
        setMemberToDelete(member);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/admin/users/${memberToDelete.id}`);
            setTeam(prev => prev.filter(m => m.id !== memberToDelete.id));
            toast.success("Team member removed successfully");
            setIsDeleteModalOpen(false);
            setMemberToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove team member");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1 text-sm">Manage your profile, company details, and preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto inline-flex overflow-x-auto justify-start border border-border mb-6">
                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="company" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                        <Building className="h-4 w-4 mr-2" />
                        Company
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="currency" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                        <Globe className="h-4 w-4 mr-2" />
                        Currency
                    </TabsTrigger>
                    {isAdmin() && (
                        <>
                            <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                                <UserCog className="h-4 w-4 mr-2" />
                                Team
                            </TabsTrigger>
                            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2">
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Admin
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="profile" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Profile Information</CardTitle>
                            <CardDescription>Update your personal details and public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-border">
                                <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-4xl shadow-inner uppercase">
                                    {user.name ? user.name.charAt(0) : "U"}
                                </div>
                                <div className="space-y-3">
                                    <Button variant="outline" size="sm" type="button" disabled className="opacity-50">Change Avatar</Button>
                                    <p className="text-xs text-muted-foreground">Profile avatars are managed via system Gravatar or Company Logo.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" defaultValue={user.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" defaultValue={user.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="+1 (555) 000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Input id="role" defaultValue={user.role?.name || 'User'} disabled className="bg-muted/50 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="company" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Company Branding & Details</CardTitle>
                            <CardDescription>Customize your workspace appearance and business info.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            {/* Logo & Branding Preview */}
                            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-border">
                                <div className="space-y-4">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Company Logo</Label>
                                    <div className="relative group h-40 w-40 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-muted/20 flex items-center justify-center">
                                        {company?.logo_path ? (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${company.logo_path}`} alt="Logo" className="max-h-32 max-w-32 object-contain" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-[10px] text-muted-foreground">Click to upload</p>
                                            </div>
                                        )}
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                        >
                                            <Plus className="h-8 w-8 text-white" />
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Theme Colors</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Primary Color Presets</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {colorPresets.map((preset) => (
                                                    <div 
                                                        key={preset.name}
                                                        onClick={() => handleColorSelect(preset.primary, preset.secondary)}
                                                        className={`h-10 w-10 rounded-lg border-2 cursor-pointer transition-all hover:scale-110 ${company?.settings?.primary_color === preset.primary ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-110' : 'border-white/10'}`}
                                                        style={{ backgroundColor: preset.primary }}
                                                        title={preset.name}
                                                    />
                                                ))}
                                            </div>
                                            <div className="pt-2">
                                                <Label className="text-[10px] text-muted-foreground italic">Or enter hex code:</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input 
                                                        className="h-8 text-xs font-mono" 
                                                        value={company?.settings?.primary_color || "#3C50E0"}
                                                        onChange={(e) => handleColorSelect(e.target.value, company?.settings?.secondary_color || "#80CAEE")}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Card className="bg-primary/5 border-primary/20 flex flex-col items-center justify-center p-4 text-center">
                                            <Building className="h-6 w-6 text-primary mb-2" />
                                            <p className="text-xs font-semibold text-primary">{company?.company_name || 'TradePulser Workspace'}</p>
                                            <p className="text-[10px] text-muted-foreground">Preview in Sidebar</p>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="companyName">Business Name</Label>
                                    <Input 
                                        id="companyName" 
                                        value={company?.company_name || ""} 
                                        onChange={(e) => setCompany(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyEmail">Business Email</Label>
                                    <Input 
                                        id="companyEmail" 
                                        value={company?.email || ""} 
                                        onChange={(e) => setCompany(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        value={company?.phone || ""} 
                                        onChange={(e) => setCompany(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input 
                                        id="country" 
                                        value={company?.country || ""} 
                                        onChange={(e) => setCompany(prev => prev ? { ...prev, country: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Base Currency</Label>
                                    <Input 
                                        id="currency" 
                                        value={company?.currency || "USD"} 
                                        onChange={(e) => setCompany(prev => prev ? { ...prev, currency: e.target.value } : null)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button onClick={handleSaveCompany} disabled={loading} className="bg-primary hover:bg-primary/90 text-white shadow-md">
                                    {loading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Branding & Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Security Settings</CardTitle>
                            <CardDescription>Update your password and secure your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input id="currentPassword" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input id="newPassword" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input id="confirmPassword" type="password" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-start gap-3">
                                <Button variant="default">Update Password</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Notification Preferences</CardTitle>
                            <CardDescription>Choose what updates you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                {[
                                    { title: "Invoice Paid", description: "Receive an email when a client pays an invoice." },
                                    { title: "Voucher Created", description: "Receive an email when a new voucher is successfully logged." },
                                    { title: "Weekly Report", description: "Get a summary of your ledger and activity every Monday." },
                                    { title: "System Updates", description: "Notices about TradePulser updates and maintenance." }
                                ].map((notification, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                                        <div>
                                            <p className="font-medium text-foreground">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                                        </div>
                                        <div className="flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                                            <span className="pointer-events-none block h-5 w-5 translate-x-5 rounded-full bg-white shadow-lg ring-0 transition-transform"></span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">Save Preferences</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="team" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-xl">Team Management</CardTitle>
                                <CardDescription>Invite team members to your company workspace.</CardDescription>
                            </div>
                            <Button onClick={() => setIsInviteModalOpen(true)} className="shadow-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Invite Member
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isTeamLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center p-8">Loading team members...</TableCell>
                                            </TableRow>
                                        ) : team.map((member) => (
                                            <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        {member.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs font-semibold">
                                                        <ShieldCheck className="h-3 w-3 mr-1 text-primary" />
                                                        {member.role?.name || "Member"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => confirmDeleteMember(member)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invite Modal */}
                    <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                        <DialogContent className="sm:max-w-md border-border bg-card">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Plus className="h-6 w-6 text-primary" />
                                    Invite Team Member
                                </DialogTitle>
                                <DialogDescription>
                                    Invite a new member to join {company?.company_name || "your workspace"}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold">Full Name</Label>
                                    <Input 
                                        placeholder="John Wick" 
                                        value={inviteForm.name}
                                        onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold">Email Address</Label>
                                    <Input 
                                        type="email" 
                                        placeholder="john@wick.com" 
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider font-bold">System Role</Label>
                                    <Select 
                                        value={inviteForm.role_id}
                                        onValueChange={(val: string | null) => setInviteForm(prev => ({ ...prev, role_id: val ?? "" }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(r => (
                                                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="bg-muted/40 p-4 -m-6 mt-4 border-t border-border">
                                <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleInviteUser} disabled={loading} className="px-8 font-bold">
                                    {loading ? "Inviting..." : "Send Invitation"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
                <TabsContent value="currency" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Currency & Exchange Rates</CardTitle>
                            <CardDescription>View and update system-wide exchange rates.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-xl border border-border bg-muted/20 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">USD to PKR Rate</p>
                                    <h2 className="text-4xl font-bold text-foreground mt-1">
                                        {typeof rate === 'number' ? rate.toFixed(2) : "---"}
                                        <span className="text-lg font-normal text-muted-foreground ml-2">PKR / USD</span>
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                        * Rates are cached daily to optimize performance.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleRefresh} 
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary/90 text-white shadow-md w-full sm:w-auto"
                                >
                                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    {loading ? "Refreshing..." : "Refresh Live Rates"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-card/50 border-dashed">
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium">Auto-Update</p>
                                        <p className="text-xs text-muted-foreground">System fetches latest rates automatically twice a day.</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/50 border-dashed">
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium">Fallback Rate</p>
                                        <p className="text-xs text-muted-foreground">Current system fallback is set to 280.00 PKR.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="admin" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Administrative Controls</CardTitle>
                            <CardDescription>Manage system access, roles, and user permissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Link href="/admin/roles" className="group">
                                    <Card className="bg-muted/20 border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Roles & Permissions</h3>
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">Define granular access levels and map them to system modules.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <Link href="/admin/users" className="group">
                                    <Card className="bg-muted/20 border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer">
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <UserCog className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg group-hover:text-emerald-600 transition-colors">User Management</h3>
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">Manage team members, assign initial passwords, and update roles.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <Link href="/admin/documents" className="group">
                                    <Card className="bg-muted/20 border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer">
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg group-hover:text-amber-600 transition-colors">Document Archive</h3>
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">Access all generated trade documents, invoices, and packing lists.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                <p className="text-xs text-orange-800 font-medium flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-orange-600" />
                                    Changes to roles or user management take effect immediately across all sessions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Deletion Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-6 pb-2 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">Remove Team Member?</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-2">
                            Are you sure you want to remove <span className="font-semibold text-foreground">{memberToDelete?.name}</span>? This action cannot be undone and they will lose all access.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="p-6 pt-2 bg-muted/30 flex gap-3 sm:flex-row flex-col-reverse">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-xl">
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteMember} 
                            disabled={loading}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 shadow-sm"
                        >
                            {loading ? "Removing..." : "Remove Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
