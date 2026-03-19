"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileCheck, ArrowRight, CreditCard } from "lucide-react";
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

interface VendorBill {
    id: number;
    vendor_id: number;
    bill_number: string;
    bill_date: string;
    due_date: string;
    currency: string;
    total_amount: number;
    status: string;
    vendor: {
        company_name: string;
        vendor_code: string;
    };
}

export default function VendorBillsPage() {
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await api.get('/vendor-bills');
                setBills(response.data);
            } catch (error) {
                console.error("Failed to fetch bills:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBills();
    }, []);

    const filteredBills = bills.filter((bill) =>
        bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Vendor Bills</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Track and manage supplier invoices and payables.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button asChild className="shadow-sm">
                        <Link href="/vendor-bills/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Log New Bill
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="relative z-10 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                        <span>All Bills</span>
                    </div>
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by bill number or vendor..."
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
                                <TableHead className="pl-6">Bill Number</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Bill Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredBills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center p-12 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <Search className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-base font-medium">No vendor bills found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBills.map((bill) => (
                                    <TableRow key={bill.id} className="hover:bg-muted/50 transition-colors group">
                                        <TableCell className="pl-6 font-mono font-medium">{bill.bill_number}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-foreground">{bill.vendor?.company_name}</div>
                                            <div className="text-xs text-muted-foreground">{bill.vendor?.vendor_code}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(bill.bill_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className={new Date(bill.due_date) < new Date() && bill.status !== 'paid' ? "text-destructive font-medium" : "text-muted-foreground"}>
                                            {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                            {bill.status === 'paid' && <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20">Paid</Badge>}
                                            {bill.status === 'partial' && <Badge className="bg-amber-500/10 text-amber-600 border-none hover:bg-amber-500/20">Partial</Badge>}
                                            {bill.status === 'unpaid' && <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none">Unpaid</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: bill.currency || 'USD' }).format(bill.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild className="h-8 group-hover:bg-primary/10 text-primary transition-colors">
                                                    <Link href={`/vendors/${bill.vendor_id}`}>
                                                        View Profile
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
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
