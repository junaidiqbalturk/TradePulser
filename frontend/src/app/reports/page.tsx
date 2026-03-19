"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, FileText, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp, TrendingDown, BookOpen, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clientsRes, invoicesRes, vouchersRes, plRes, bsRes, tbRes, agingRes, unreconciledRes] = await Promise.all([
                api.get('/clients'),
                api.get('/invoices'),
                api.get('/vouchers'),
                api.get('/reports/profit-loss'),
                api.get('/reports/balance-sheet'),
                api.get('/reports/trial-balance'),
                api.get('/reports/aging'),
                api.get('/vouchers/unreconciled')
            ]);
            setClients(clientsRes.data);
            setInvoices(invoicesRes.data);
            setVouchers(vouchersRes.data);
            setPlData(plRes.data);
            setBalanceSheet(bsRes.data);
            setTrialBalance(tbRes.data);
            setAgingData(agingRes.data);
            setUnreconciledVouchers(unreconciledRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
    };

    const outstandingList = clients.map(client => {
        const clientInvs = invoices.filter(i => i.client_id === client.id);
        const clientReceipts = vouchers.filter(v => v.client_id === client.id && v.type === 'receipt');

        const totalBilled = clientInvs.reduce((acc, i) => acc + i.total_amount, 0);
        const totalPaid = clientReceipts.reduce((acc, v) => acc + v.amount, 0);
        const balance = totalBilled - totalPaid;

        return { ...client, totalBilled, totalPaid, balance };
    }).filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

    // Global Stats
    const globalBilled = invoices.reduce((acc, i) => acc + i.total_amount, 0);
    const globalCollected = vouchers.filter(v => v.type === 'receipt').reduce((acc, v) => acc + v.amount, 0);
    const globalExpenses = vouchers.filter(v => v.type === 'payment').reduce((acc, v) => acc + v.amount, 0);
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

            {loading ? (
                <div className="flex justify-center p-24"><Activity className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">

                    {/* Rich Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div variants={fadeUp}>
                            <Card className="border border-border bg-card shadow-sm hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
                                            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(globalBilled)}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="border border-border bg-card shadow-sm hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                                            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(globalCollected)}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="border border-border bg-card shadow-sm hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                                            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(globalOutstanding)}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <AlertCircle className="h-5 w-5 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="border border-border bg-card shadow-sm hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                                            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(globalExpenses)}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                            <ArrowUpRight className="h-5 w-5 text-rose-500" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
                            </Card>
                        </motion.div>
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
                                                            <Button size="sm" variant="outline" className="h-8">Match to Invoice</Button>
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
                                                    <TableHead className="text-right pr-6 font-medium">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map(inv => (
                                                    <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="pl-6 font-medium text-foreground">{inv.invoice_number}</TableCell>
                                                        <TableCell className="text-foreground">{inv.client?.company_name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                                                        <TableCell className="text-right pr-6 font-bold text-foreground">{formatCurrency(inv.total_amount)}</TableCell>
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
                                                    <TableHead className="text-right pr-6 font-medium">Amount</TableHead>
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
                                                        <TableCell className="text-right pr-6 font-bold text-foreground">{formatCurrency(v.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </motion.div>
            )}
        </div >
    );
}

