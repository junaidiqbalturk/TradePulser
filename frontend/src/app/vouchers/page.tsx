"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, StickyNote, Printer, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Voucher {
    id: number;
    voucher_number: string;
    client: { company_name: string } | null;
    vendor: { company_name: string } | null;
    vendor_bank: { bank_name: string } | null;
    client_bank: { bank_name: string } | null;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    amount: number;
    payment_method: string;
}

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [pendingVouchers, setPendingVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vouchersRes, pendingRes] = await Promise.all([
                api.get("/vouchers"),
                api.get("/vouchers/pending")
            ]);
            setVouchers(vouchersRes.data);
            setPendingVouchers(pendingRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/vouchers/${id}/approve`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Reason for rejection:");
        if (reason === null) return;
        try {
            await api.post(`/vouchers/${id}/reject`, { reason });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(amount);
    };

    const filteredVouchers = vouchers.filter((voucher) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            voucher.voucher_number?.toLowerCase().includes(lowerQuery) ||
            voucher.client?.company_name?.toLowerCase().includes(lowerQuery) ||
            voucher.vendor?.company_name?.toLowerCase().includes(lowerQuery) ||
            voucher.date?.toLowerCase().includes(lowerQuery) ||
            voucher.type?.toLowerCase().includes(lowerQuery) ||
            voucher.payment_method?.toLowerCase().includes(lowerQuery) ||
            voucher.amount?.toString().includes(lowerQuery)
        );
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Vouchers</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage accounting transactions.</p>
                </div>
                <Link href="/vouchers/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Voucher
                    </Button>
                </Link>
            </div>

            {pendingVouchers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6 mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Pending Approvals</h2>
                            <p className="text-sm text-muted-foreground">Transactions awaiting review before posting to General Ledger.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {pendingVouchers.map((voucher) => (
                                <motion.div
                                    key={voucher.id}
                                    layout
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs text-muted-foreground">{voucher.voucher_number}</span>
                                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase">Pending</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm line-clamp-1">
                                            {voucher.client?.company_name || voucher.vendor?.company_name || 'Generic Transaction'}
                                        </p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(voucher.amount)}</p>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button 
                                            size="sm" 
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9"
                                            onClick={() => handleApprove(voucher.id)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1 border-rose-200 text-rose-500 hover:bg-rose-50 font-bold h-9"
                                            onClick={() => handleReject(voucher.id)}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <StickyNote className="h-5 w-5 text-muted-foreground" />
                        <span>All Vouchers</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search vouchers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 rounded-md bg-background" />
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Voucher #</TableHead>
                            <TableHead>Client / Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">Loading vouchers...</TableCell>
                            </TableRow>
                        ) : filteredVouchers.map((voucher) => (
                            <TableRow key={voucher.id} className="hover:bg-muted/50 transition-colors group">
                                <TableCell className="font-medium text-foreground">{voucher.voucher_number}</TableCell>
                                <TableCell className="text-foreground">
                                    {voucher.client?.company_name || voucher.vendor?.company_name || <span className="text-muted-foreground italic">Generic</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{voucher.date}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${voucher.status === 'approved'
                                        ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200'
                                        : voucher.status === 'rejected'
                                        ? 'bg-rose-100/50 text-rose-700 border border-rose-200'
                                        : 'bg-orange-100/50 text-orange-700 border border-orange-200'
                                        }`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${voucher.status === 'approved' ? 'bg-emerald-500' : voucher.status === 'rejected' ? 'bg-rose-500' : 'bg-orange-500'}`} />
                                        {voucher.status || 'approved'}
                                    </span>
                                </TableCell>
                                <TableCell className="capitalize text-muted-foreground">{voucher.payment_method}</TableCell>
                                <TableCell className="text-right font-bold text-foreground">
                                    {formatCurrency(voucher.amount)}
                                </TableCell>
                                <TableCell className="text-right pr-5">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" onClick={() => window.open(`/vouchers/${voucher.id}/print`, '_blank')} title="Print Voucher">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && filteredVouchers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center p-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-base font-medium">No vouchers found matching your search.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

