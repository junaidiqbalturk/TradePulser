"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Factory, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vendor {
    id: number;
    vendor_code: string;
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    currency: string;
    total_balance: number;
    created_at: string;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await api.get('/vendors');
                setVendors(response.data);
            } catch (error) {
                console.error("Failed to fetch vendors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, []);

    const filteredVendors = vendors.filter((vendor) =>
        vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Vendors & Suppliers</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your suppliers, track payables, and maintain vendor ledgers.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button asChild className="shadow-sm">
                        <Link href="/vendors/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vendor
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="relative z-10 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Factory className="h-5 w-5 text-muted-foreground" />
                        <span>Vendor Directory</span>
                    </div>
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 bg-background border-input focus-visible:ring-1 focus-visible:ring-ring h-9 rounded-md shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Vendor Code</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Country / Currency</TableHead>
                                <TableHead className="text-right">A/P Balance</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredVendors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-12 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <Search className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-base font-medium">No vendors found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <TableRow key={vendor.id} className="hover:bg-muted/50 transition-colors group">
                                        <TableCell className="pl-6">
                                            <Badge variant="outline" className="font-mono">{vendor.vendor_code}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-foreground">{vendor.company_name}</div>
                                            <div className="text-xs text-muted-foreground">{vendor.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-foreground font-medium">{vendor.contact_person || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">{vendor.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-muted-foreground">{vendor.country || 'N/A'}</div>
                                            <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none">{vendor.currency}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                            {formatCurrency(vendor.total_balance, vendor.currency)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" asChild className="h-8 group-hover:bg-primary/10 text-primary transition-colors">
                                                <Link href={`/vendors/${vendor.id}`}>
                                                    View Profile
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
