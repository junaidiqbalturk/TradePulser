"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, FileText, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp, TrendingDown, BookOpen, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { ReconciliationModal } from "@/components/reconciliation/ReconciliationModal";
import { toast } from "sonner";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ReportsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [plData, setPlData] = useState<any>(null);
    const [balanceSheet, setBalanceSheet] = useState<any>(null);
    const [trialBalance, setTrialBalance] = useState<any[]>([]);
    const [agingData, setAgingData] = useState<any>(null);
    const [unreconciledVouchers, setUnreconciledVouchers] = useState<any[]>([]);
    const [pendingReversals, setPendingReversals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
    const [reversalTarget, setReversalTarget] = useState<{ type: string, id: number } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clientsRes, invoicesRes, vouchersRes, plRes, bsRes, tbRes, agingRes, unreconciledRes, reversalsRes] = await Promise.all([
                api.get('/clients'),
                api.get('/invoices'),
                api.get('/vouchers'),
                api.get('/reports/profit-loss'),
                api.get('/reports/balance-sheet'),
                api.get('/reports/trial-balance'),
                api.get('/reports/aging'),
                api.get('/reconciliation/unreconciled-vouchers'),
                api.get('/reversals/pending').catch(() => ({ data: { all: [] } })) // Optional for non-managers
            ]);
            setClients(clientsRes.data);
            setInvoices(invoicesRes.data);
            setVouchers(vouchersRes.data);
            setPlData(plRes.data);
            setBalanceSheet(bsRes.data);
            setTrialBalance(tbRes.data);
            setAgingData(agingRes.data);
            setUnreconciledVouchers(unreconciledRes.data);
            setPendingReversals(Array.isArray(reversalsRes.data.all) ? reversalsRes.data.all : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(value);
    };

    const outstandingList = clients.map(client => {
        const clientInvs = invoices.filter(i => i.client_id === client.id);
        const clientReceipts = vouchers.filter(v => v.client_id === client.id && v.type === 'receipt');

        const totalBilled = clientInvs.reduce((acc, i) => acc + parseFloat(i.total_amount || 0), 0);
        const totalPaid = clientReceipts.reduce((acc, v) => acc + parseFloat(v.amount || 0), 0);
        const balance = totalBilled - totalPaid;

        return { ...client, totalBilled, totalPaid, balance };
    }).filter(c => c.balance > 0.01).sort((a, b) => b.balance - a.balance);

    // Global Stats
    const globalBilled = invoices.reduce((acc, i) => acc + parseFloat(i.total_amount || 0), 0);
    const globalCollected = vouchers.filter(v => v.type === 'receipt').reduce((acc, v) => acc + parseFloat(v.amount || 0), 0);
    const globalExpenses = vouchers.filter(v => v.type === 'payment').reduce((acc, v) => acc + parseFloat(v.amount || 0), 0);
    const globalOutstanding = outstandingList.reduce((acc, c) => acc + c.balance, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Reports & Intelligence</h1>
                <p className="text-muted-foreground mt-1 text-sm">Essential business summaries and financial metrics.</p>
            </motion.div>

            {isReversalModalOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-rose-500" /> Request Reversal</h2>
                        <p className="text-sm text-muted-foreground">Please provide a detailed reason for reversing this {reversalTarget?.type}. This will be sent for supervisory approval.</p>
                        <textarea 
                            id="reversal-reason"
                            className="w-full h-32 p-3 bg-muted border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Reason for reversal..."
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsReversalModalOpen(false)}>Cancel</Button>
                            <Button 
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                                onClick={async () => {
                                    const reason = (document.getElementById('reversal-reason') as HTMLTextAreaElement).value;
                                    if (!reason || reason.length < 5) {
                                        toast.error("Please provide a valid reason (min 5 characters)");
                                        return;
                                    }
                                    try {
                                        await api.post(`/reversals/${reversalTarget?.type}/${reversalTarget?.id}/request`, { reason });
                                        toast.success("Reversal request submitted");
                                        setIsReversalModalOpen(false);
                                        fetchData();
                                    } catch (err: any) {
                                        toast.error(err.response?.data?.error || "Failed to submit request");
                                    }
                                }}
                            >
                                Submit Request
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-24"><Activity className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">

                    {/* Dashboard-Style Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { 
                                title: "Total Billed", 
                                value: formatCurrency(globalBilled), 
                                icon: FileText, 
                                color: "text-primary", 
                                bg: "bg-primary/10", 
                                gradient: "hover:bg-primary/5" 
                            },
                            { 
                                title: "Total Collected", 
                                value: formatCurrency(globalCollected), 
                                icon: ArrowDownRight, 
                                color: "text-emerald-500", 
                                bg: "bg-emerald-500/10", 
                                gradient: "hover:bg-emerald-500/5" 
                            },
                            { 
                                title: "Total Outstanding", 
                                value: formatCurrency(globalOutstanding), 
                                icon: AlertCircle, 
                                color: "text-orange-500", 
                                bg: "bg-orange-500/10", 
                                gradient: "hover:bg-orange-500/5" 
                            },
                            { 
                                title: "Total Expenses", 
                                value: formatCurrency(globalExpenses), 
                                icon: ArrowUpRight, 
                                color: "text-rose-500", 
                                bg: "bg-rose-500/10", 
                                gradient: "hover:bg-rose-500/5" 
                            }
                        ].map((stat, i) => (
                            <motion.div 
                                variants={fadeUp} 
                                key={i}
                                whileHover={{ y: -5, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="group"
                            >
                                <Card className={`relative overflow-hidden border border-border bg-card shadow-sm p-6 transition-all duration-300 ${stat.gradient}`}>
                                    {/* Background Watermark Icon */}
                                    <motion.div
                                        initial={{ opacity: 0.05, scale: 1 }}
                                        whileHover={{ opacity: 0.1, scale: 1.2, rotate: 12 }}
                                        className="absolute -right-6 -bottom-6 pointer-events-none z-0"
                                    >
                                        <stat.icon className={`h-32 w-32 ${stat.color}`} />
                                    </motion.div>

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-bold text-foreground tracking-tight line-clamp-1">
                                                {stat.value}
                                            </h4>
                                            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeUp}>
                        <Tabs defaultValue="outstanding" className="space-y-6">
                            <TabsList className="bg-muted p-1 rounded-xl h-12 w-full sm:w-auto inline-flex overflow-x-auto justify-start">
                                <TabsTrigger value="outstanding" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><Wallet className="h-4 w-4" /> AR/AP Aging</TabsTrigger>
                                <TabsTrigger value="reconcile" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><Activity className="h-4 w-4" /> Reconciliation</TabsTrigger>
                                <TabsTrigger value="pl" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><TrendingUp className="h-4 w-4" /> P&L</TabsTrigger>
                                <TabsTrigger value="bs" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><BookOpen className="h-4 w-4" /> Balance Sheet</TabsTrigger>
                                <TabsTrigger value="tb" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><Activity className="h-4 w-4" /> Trial Balance</TabsTrigger>
                                <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><FileText className="h-4 w-4" /> Invoices</TabsTrigger>
                                <TabsTrigger value="vouchers" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><BarChart3 className="h-4 w-4" /> Vouchers</TabsTrigger>
                                <TabsTrigger value="reversals" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4 relative">
                                    <Clock className="h-4 w-4" /> Reversals
                                    {pendingReversals.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                            {pendingReversals.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="outstanding" className="mt-0 outline-none">
                                {agingData && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { label: 'Current', key: 'current', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                            { label: '1-30 Days', key: '30_days', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                            { label: '31-60 Days', key: '60_days', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                            { label: '90+ Days', key: '90_plus', color: 'text-rose-700', bg: 'bg-rose-700/10' },
                                        ].map((bucket) => (
                                            <Card key={bucket.key} className="border-border shadow-sm">
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-full ${bucket.bg} flex items-center justify-center shrink-0`}>
                                                        <Activity className={`h-5 w-5 ${bucket.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">{bucket.label}</p>
                                                        <p className={`text-lg font-bold ${bucket.color}`}>{formatCurrency(agingData[bucket.key]?.total || 0)}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Outstanding Client Balances</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">Clients who currently owe money based on invoices vs receipts.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-muted/20">
                                                    <TableHead className="pl-6 font-medium">Client</TableHead>
                                                    <TableHead className="text-right font-medium">Total Billed</TableHead>
                                                    <TableHead className="text-right font-medium">Total Paid</TableHead>
                                                    <TableHead className="w-[200px] font-medium">Progress</TableHead>
                                                    <TableHead className="text-right pr-6 text-orange-500 font-semibold">Outstanding</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {outstandingList.map((c, idx) => {
                                                    const paidPercent = c.totalBilled > 0 ? Math.min(100, Math.round((c.totalPaid / c.totalBilled) * 100)) : 0;
                                                    return (
                                                        <TableRow key={c.id} className="group hover:bg-muted/50 transition-colors">
                                                            <TableCell className="pl-6 font-medium text-foreground">{c.company_name}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(c.totalBilled)}</TableCell>
                                                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(c.totalPaid)}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${paidPercent}%` }}
                                                                            transition={{ duration: 1, delay: 0.1 * idx }}
                                                                            className="h-full bg-emerald-500 rounded-full"
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground w-8 font-medium">{paidPercent}%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 font-bold text-orange-500">{formatCurrency(c.balance)}</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                                {outstandingList.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center p-12 text-muted-foreground">
                                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                                    <Activity className="h-6 w-6 text-emerald-500" />
                                                                </div>
                                                                <p>No outstanding balances. Great job!</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="pl" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-bold text-foreground">Profit & Loss Statement</CardTitle>
                                            <CardDescription className="text-muted-foreground font-medium mt-1">Summary of revenues and expenses for the current period.</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                                            <p className={`text-2xl font-bold ${(plData?.net_profit || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {formatCurrency(plData?.net_profit || 0)}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border">
                                            <div className="p-6 space-y-4">
                                                <h3 className="font-bold text-emerald-600 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Operating Revenue</h3>
                                                <div className="space-y-2">
                                                    {plData?.revenue?.details.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50">
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                            <span className="font-medium text-foreground">{formatCurrency(item.balance)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between font-bold pt-2 text-foreground">
                                                        <span>Total Revenue</span>
                                                        <span>{formatCurrency(plData?.revenue?.total || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <h3 className="font-bold text-rose-600 flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Operating Expenses</h3>
                                                <div className="space-y-2">
                                                    {plData?.expenses?.details.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50">
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                            <span className="font-medium text-foreground">{formatCurrency(item.balance)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between font-bold pt-2 text-foreground">
                                                        <span>Total Expenses</span>
                                                        <span>{formatCurrency(plData?.expenses?.total || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bs" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Balance Sheet</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">Snapshot of assets, liabilities, and equity.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-primary flex items-center gap-2">Assets</h3>
                                                <div className="space-y-2">
                                                    {balanceSheet?.assets?.details.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm border-b border-border pb-1">
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                            <span>{formatCurrency(item.balance)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between font-bold text-foreground pt-1">
                                                        <span>Total Assets</span>
                                                        <span>{formatCurrency(balanceSheet?.assets?.total || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-orange-500 flex items-center gap-2">Liabilities</h3>
                                                <div className="space-y-2">
                                                    {balanceSheet?.liabilities?.details.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm border-b border-border pb-1">
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                            <span>{formatCurrency(item.balance)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between font-bold text-foreground pt-1">
                                                        <span>Total Liabilities</span>
                                                        <span>{formatCurrency(balanceSheet?.liabilities?.total || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-emerald-500 flex items-center gap-2">Equity</h3>
                                                <div className="space-y-2">
                                                    {balanceSheet?.equity?.details.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm border-b border-border pb-1">
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                            <span>{formatCurrency(item.balance)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between font-bold text-foreground pt-1">
                                                        <span>Total Equity</span>
                                                        <span>{formatCurrency(balanceSheet?.equity?.total || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-sm font-semibold">
                                            <div className="flex gap-4">
                                                <span>A = L + E Check:</span>
                                                <span className={balanceSheet?.is_balanced ? 'text-emerald-500' : 'text-rose-500'}>
                                                    {balanceSheet?.is_balanced ? 'Balanced' : 'Imbalanced'}
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground">Values as of {balanceSheet?.as_of}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tb" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Trial Balance</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">Listing of all General Ledger accounts and their balances.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/20">
                                                    <TableHead className="pl-6">Code</TableHead>
                                                    <TableHead>Account Name</TableHead>
                                                    <TableHead className="text-right">Debit</TableHead>
                                                    <TableHead className="text-right">Credit</TableHead>
                                                    <TableHead className="text-right pr-6">Net Balance</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {trialBalance.map(acc => (
                                                    <TableRow key={acc.code} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="pl-6 font-mono text-muted-foreground">{acc.code}</TableCell>
                                                        <TableCell className="font-medium">{acc.name}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</TableCell>
                                                        <TableCell className={`text-right pr-6 font-bold ${acc.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="reconcile" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-bold text-foreground">Payment Reconciliation</CardTitle>
                                            <CardDescription className="text-muted-foreground font-medium mt-1">Match received payments to outstanding invoices.</CardDescription>
                                        </div>
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-200">
                                            {unreconciledVouchers.length} Unreconciled Vouchers
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/20">
                                                    <TableHead className="pl-6">Voucher #</TableHead>
                                                    <TableHead>Client</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="text-right pr-6">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {unreconciledVouchers.map(v => (
                                                    <TableRow key={v.id}>
                                                        <TableCell className="pl-6 font-mono font-medium">{v.voucher_number}</TableCell>
                                                        <TableCell>{v.client?.company_name || 'N/A'}</TableCell>
                                                        <TableCell className="text-muted-foreground">{v.date}</TableCell>
                                                        <TableCell className="text-right font-bold">{formatCurrency(v.amount)}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-8 font-bold hover:bg-primary hover:text-white transition-all rounded-lg"
                                                                onClick={() => {
                                                                    setSelectedVoucher(v);
                                                                    setIsModalOpen(true);
                                                                }}
                                                            >
                                                                Match to Invoice
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {unreconciledVouchers.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center p-12 text-muted-foreground">
                                                            All payments are reconciled!
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="invoices" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Invoice Summary</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">All billed invoices sorted by date.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-muted/20">
                                                    <TableHead className="pl-6 font-medium">Invoice #</TableHead>
                                                    <TableHead className="font-medium">Client</TableHead>
                                                    <TableHead className="font-medium">Date</TableHead>
                                                    <TableHead className="text-right font-medium">Amount</TableHead>
                                                    <TableHead className="text-right pr-6 font-medium">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map(inv => (
                                                    <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="pl-6 font-medium text-foreground">{inv.invoice_number}</TableCell>
                                                        <TableCell className="text-foreground">{inv.client?.company_name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                                                        <TableCell className="text-right font-bold text-foreground">{formatCurrency(inv.total_amount)}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            {inv.status !== 'reversed' && inv.status !== 'reversal_pending' && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => {
                                                                        setReversalTarget({ type: 'invoice', id: inv.id });
                                                                        setIsReversalModalOpen(true);
                                                                    }}
                                                                >
                                                                    Reverse
                                                                </Button>
                                                            )}
                                                            {inv.status === 'reversal_pending' && (
                                                                <span className="text-[10px] font-bold text-orange-500 uppercase">Pending Rev.</span>
                                                            )}
                                                            {inv.status === 'reversed' && (
                                                                <span className="text-[10px] font-bold text-rose-500 uppercase">Reversed</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="vouchers" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Voucher Summary</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">All accounting vouchers registered.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-muted/20">
                                                    <TableHead className="pl-6 font-medium">Voucher #</TableHead>
                                                    <TableHead className="font-medium">Client / Entity</TableHead>
                                                    <TableHead className="font-medium">Type</TableHead>
                                                    <TableHead className="font-medium">Date</TableHead>
                                                    <TableHead className="text-right font-medium">Amount</TableHead>
                                                    <TableHead className="text-right pr-6 font-medium">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {vouchers.map(v => (
                                                    <TableRow key={v.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="pl-6 font-medium text-foreground">{v.voucher_number}</TableCell>
                                                        <TableCell className="text-foreground">{v.client?.company_name || v.paid_to || 'System Entity'}</TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${v.type === 'receipt'
                                                                ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
                                                                : 'bg-primary/10 text-primary border-primary/20'
                                                                }`}>
                                                                {v.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{v.date}</TableCell>
                                                        <TableCell className="text-right font-bold text-foreground">{formatCurrency(v.amount)}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            {v.status !== 'reversed' && v.status !== 'reversal_pending' && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => {
                                                                        setReversalTarget({ type: 'voucher', id: v.id });
                                                                        setIsReversalModalOpen(true);
                                                                    }}
                                                                >
                                                                    Reverse
                                                                </Button>
                                                            )}
                                                            {v.status === 'reversal_pending' && (
                                                                <span className="text-[10px] font-bold text-orange-500 uppercase">Pending Rev.</span>
                                                            )}
                                                            {v.status === 'reversed' && (
                                                                <span className="text-[10px] font-bold text-rose-500 uppercase">Reversed</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="reversals" className="mt-0 outline-none">
                                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                    <CardHeader className="bg-muted/40 border-b border-border px-6 py-5">
                                        <CardTitle className="text-xl font-bold text-foreground">Pending Reversal Requests</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium mt-1">Transactions waiting for supervisor approval to be reversed.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/20">
                                                    <TableHead className="pl-6">Type</TableHead>
                                                    <TableHead>Reference #</TableHead>
                                                    <TableHead>Requested By</TableHead>
                                                    <TableHead>Reason</TableHead>
                                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingReversals.map((r: any) => (
                                                    <TableRow key={`${r.type}-${r.id}`}>
                                                        <TableCell className="pl-6">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.type === 'invoice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                {r.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-mono font-medium">{r.invoice_number || r.voucher_number}</TableCell>
                                                        <TableCell className="text-sm">{r.reversal_requester?.name || 'Unknown'}</TableCell>
                                                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={r.reversal_reason}>{r.reversal_reason}</TableCell>
                                                        <TableCell className="text-right pr-6 space-x-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.post(`/reversals/${r.type}/${r.id}/approve`);
                                                                        toast.success("Reversal approved");
                                                                        fetchData();
                                                                    } catch (err: any) {
                                                                        toast.error(err.response?.data?.error || "Approval failed");
                                                                    }
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="h-8"
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.post(`/reversals/${r.type}/${r.id}/reject`);
                                                                        toast.info("Reversal rejected");
                                                                        fetchData();
                                                                    } catch (err: any) {
                                                                        toast.error("Rejection failed");
                                                                    }
                                                                }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {pendingReversals.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center p-12 text-muted-foreground">
                                                            No pending reversal requests.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </motion.div>
            )}

            <ReconciliationModal 
                voucher={selectedVoucher}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedVoucher(null);
                }}
                onSuccess={() => {
                    setIsModalOpen(false);
                    setSelectedVoucher(null);
                    fetchData(); // Refresh all data
                }}
            />
        </div >
    );
}

