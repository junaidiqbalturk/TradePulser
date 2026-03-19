"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, ArrowRight, ShoppingCart, Filter } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

interface PurchaseOrder {
    id: number;
    po_number: string;
    vendor: {
        company_name: string;
    };
    order_date: string;
    expected_delivery: string;
    currency: string;
    total_amount: number;
    status: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    ordered: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    completed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/purchase-orders');
                setOrders(response.data);
            } catch (error) {
                console.error("Failed to fetch purchase orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'PKR' }).format(amount || 0);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                        Procurement Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create and track Purchase Orders, manage inventory inflows, and vendor bills.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button asChild className="shadow-lg hover:shadow-xl transition-shadow">
                        <Link href="/purchase-orders/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Purchase Order
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="relative z-10 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                            <Filter className="h-4 w-4 text-primary" />
                            <span>Filters:</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {["all", "draft", "approved", "ordered", "received", "completed"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border transition-all whitespace-nowrap",
                                        statusFilter === status 
                                            ? "bg-primary text-white border-primary shadow-md scale-105" 
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by PO# or Vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 bg-background border-input focus-visible:ring-1 focus-visible:ring-ring h-9 rounded-md shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="pl-6 font-bold py-4">PO Number</TableHead>
                                <TableHead className="font-bold">Vendor</TableHead>
                                <TableHead className="font-bold">Order Date</TableHead>
                                <TableHead className="font-bold">Total Amount</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-20 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-bold text-foreground">No Purchase Orders</p>
                                                <p className="text-sm">Start your procurement workflow by creating a new PO.</p>
                                            </div>
                                            <Button variant="outline" onClick={() => {setSearchTerm(""); setStatusFilter("all");}}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/purchase-orders/${order.id}`}>
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    PO
                                                </div>
                                                <span className="font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                    {order.po_number}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-foreground">{order.vendor.company_name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-foreground">{order.order_date}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase">Expected: {order.expected_delivery || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell className="font-black text-foreground">
                                            {formatCurrency(order.total_amount, order.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("font-bold uppercase tracking-widest text-[10px] px-3 py-1 border shadow-sm", statusColors[order.status])}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" className="h-8 group-hover:bg-primary group-hover:text-white transition-all">
                                                Details
                                                <ArrowRight className="ml-2 h-4 w-4" />
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
