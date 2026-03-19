"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingDown, TrendingUp, DollarSign, List, LayoutGrid, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface LedgerEntry {
    id: number;
    date: string;
    description: string;
    debit: string | number;
    credit: string | number;
    balance: number;
    invoice_id: number | null;
    voucher_id: number | null;
    invoice?: { invoice_number: string };
    voucher?: { voucher_number: string };
}

export default function LedgerPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [journalRegistry, setJournalRegistry] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [activeTab, setActiveTab] = useState("client");

    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const { data } = await api.get("/clients");
                setClients(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (activeTab === "coa" && accounts.length === 0) {
            api.get("/accounts").then(res => setAccounts(res.data)).catch(console.error);
        }
        if (activeTab === "journal" && journalRegistry.length === 0) {
            api.get("/journal-registry").then(res => setJournalRegistry(res.data)).catch(console.error);
        }
    }, [activeTab]);

    useEffect(() => {
        if (!selectedClient) {
            setLedger([]);
            return;
        }

        const fetchLedger = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/ledgers/client/${selectedClient}`);
                setLedger(data);
            } catch (error) {
                console.error(error);
                setLedger([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLedger();
    }, [selectedClient]);

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(num || 0);
    };

    const totalDebit = ledger.reduce((sum, item) => sum + parseFloat(item.debit as string || '0'), 0);
    const totalCredit = ledger.reduce((sum, item) => sum + parseFloat(item.credit as string || '0'), 0);
    const closingBalance = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

    const Badge = ({ children, className }: any) => (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Accounting Ledger</h1>
                <p className="text-muted-foreground mt-1 text-sm">Comprehensive views of accounts, journals, and client statements.</p>
            </div>

            <Tabs defaultValue="client" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted p-1 rounded-xl h-12 w-full sm:w-auto inline-flex overflow-x-auto justify-start">
                    <TabsTrigger value="client" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><BookOpen className="h-4 w-4" /> Client Ledger</TabsTrigger>
                    <TabsTrigger value="coa" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><LayoutGrid className="h-4 w-4" /> Chart of Accounts</TabsTrigger>
                    <TabsTrigger value="journal" className="rounded-lg data-[state=active]:bg-background flex items-center gap-2 px-4"><FileText className="h-4 w-4" /> Journal Registry</TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="mt-0 space-y-8 outline-none">
                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
                        <span className="text-sm font-medium text-muted-foreground">Detailed Statement for:</span>
                        <div className="w-full sm:w-72">
                            <Select onValueChange={(val) => setSelectedClient(val || "")} value={selectedClient} disabled={loadingClients}>
                                <SelectTrigger className="bg-background shadow-sm h-11 border-border">
                                    <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedClient ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border border-border shadow-sm rounded-xl bg-card">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit (Billed)</CardTitle>
                                        <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">{formatCurrency(totalDebit)}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border border-border shadow-sm rounded-xl bg-card">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit (Received)</CardTitle>
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                                            <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">{formatCurrency(totalCredit)}</div>
                                    </CardContent>
                                </Card>
                                <Card className={`border border-border shadow-sm rounded-xl ${closingBalance > 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className={`text-sm font-medium ${closingBalance > 0 ? 'text-primary' : 'text-muted-foreground'}`}>Closing Balance</CardTitle>
                                        <div className={`p-2 rounded-lg ${closingBalance > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                                            <DollarSign className={`h-4 w-4 ${closingBalance > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${closingBalance > 0 ? 'text-primary' : 'text-foreground'}`}>
                                            {formatCurrency(closingBalance)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {closingBalance > 0 ? 'Client owes you' : closingBalance < 0 ? 'You owe client' : 'Settled'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-border bg-muted/40 flex items-center gap-2 text-foreground font-medium">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    <span>Statement of Account</span>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Credit</TableHead>
                                            <TableHead className="text-right font-bold">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">Loading ledger data...</TableCell>
                                            </TableRow>
                                        ) : ledger.length > 0 ? (
                                            ledger.map((entry) => (
                                                <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="text-muted-foreground w-[120px]">{entry.date}</TableCell>
                                                    <TableCell className="font-medium text-foreground">{entry.description}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {entry.invoice ? `INV-${entry.invoice.invoice_number}` : ''}
                                                        {entry.voucher ? `VOU-${entry.voucher.voucher_number}` : ''}
                                                        {!entry.invoice && !entry.voucher ? '-' : ''}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                                                        {parseFloat(entry.debit as string) > 0 ? formatCurrency(entry.debit) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                                                        {parseFloat(entry.credit as string) > 0 ? formatCurrency(entry.credit) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-foreground whitespace-nowrap">
                                                        {formatCurrency(entry.balance)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center p-12 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-base font-medium">No transactions found for this client.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 sm:p-24 border border-dashed border-border rounded-xl bg-card/50 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">Select a Client</h2>
                            <p className="text-muted-foreground max-w-sm">Choose a client from the dropdown menu above to view their complete statement of account and ledger history.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="coa" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl font-bold">Chart of Accounts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-6">Code</TableHead>
                                        <TableHead>Account Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right pr-6">Primary Currency</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accounts.map(acc => (
                                        <TableRow key={acc.id}>
                                            <TableCell className="pl-6 font-mono text-muted-foreground">{acc.code}</TableCell>
                                            <TableCell className="font-bold">{acc.name}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-primary/5 text-primary border border-primary/20 capitalize">
                                                    {acc.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 font-medium">PKR</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journal" className="mt-0 outline-none">
                    <div className="space-y-6">
                        {journalRegistry.map((entry) => (
                            <Card key={entry.id} className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                                <CardHeader className="bg-muted/40 border-b border-border px-6 py-4 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">{entry.reference}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{entry.date}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 uppercase">
                                        Posted
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/10 border-none">
                                                <TableHead className="pl-6 h-10">Account</TableHead>
                                                <TableHead className="h-10">Notes</TableHead>
                                                <TableHead className="text-right h-10">Debit</TableHead>
                                                <TableHead className="text-right h-10 pr-6">Credit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entry.items.map((item: any) => (
                                                <TableRow key={item.id} className="border-none hover:bg-transparent">
                                                    <TableCell className="pl-6 py-2">
                                                        <p className="font-medium">{item.account?.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{item.account?.code}</p>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-sm text-muted-foreground">{item.notes}</TableCell>
                                                    <TableCell className="text-right py-2 font-medium">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</TableCell>
                                                    <TableCell className="text-right py-2 pr-6 font-medium">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
