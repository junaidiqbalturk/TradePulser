// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Loader2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id;

    const [client, setClient] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Bank Form State
    const [bankForm, setBankForm] = useState({
        bank_name: "", account_title: "", account_number: "", iban: "", swift_code: "", currency: "PKR"
    });
    const [bankDialogOpen, setBankDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchData = async () => {
        try {
            const { data: clientData } = await api.get(`/clients/${clientId}`);
            setClient(clientData);

            const { data: ledgerData } = await api.get(`/ledgers/client/${clientId}`);
            setLedger(ledgerData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBank = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/clients/${clientId}/banks`, bankForm);
            setBankDialogOpen(false);
            setBankForm({ bank_name: "", account_title: "", account_number: "", iban: "", swift_code: "", currency: "PKR" });
            fetchData(); // refresh
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!client) {
        return <div className="p-8 text-center">Client not found</div>;
    }

    const formatCurrency = (amount: number, currency: string = 'PKR') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    // derived data
    const totalReceivable = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            <div className="relative z-10 space-y-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{client.company_name}</h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                #{client.id.toString().padStart(4, '0')}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className={`text-2xl font-bold ${totalReceivable > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                            {formatCurrency(totalReceivable)}
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto inline-flex overflow-x-auto justify-start border border-border">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background px-4">Overview</TabsTrigger>
                        <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-background px-4">Ledger ({ledger.length})</TabsTrigger>
                        <TabsTrigger value="banks" className="rounded-lg data-[state=active]:bg-background px-4">Bank Details ({client.banks?.length || 0})</TabsTrigger>
                        <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-background px-4">Invoices ({client.invoices?.length || 0})</TabsTrigger>
                        <TabsTrigger value="vouchers" className="rounded-lg data-[state=active]:bg-background px-4">Vouchers ({client.vouchers?.filter((v: any) => v.type !== 'receipt').length || 0})</TabsTrigger>
                        <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-background px-4">Payments ({client.vouchers?.filter((v: any) => v.type === 'receipt').length || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0 outline-none">
                        <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                            <CardHeader className="bg-muted/40 border-b border-border">
                                <CardTitle className="text-foreground">Client Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Contact Person</p>
                                            <p className="text-sm text-muted-foreground">{client.contact_person || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Phone</p>
                                            <p className="text-sm text-muted-foreground">{client.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Email</p>
                                            <p className="text-sm text-muted-foreground">{client.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Address</p>
                                            <p className="text-sm text-muted-foreground">{client.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm">Country</p>
                                            <p className="text-sm text-muted-foreground">{client.country || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ledger" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Client Ledger</CardTitle>
                                <CardDescription>Automatic ledger entries from invoices and vouchers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right text-orange-500">Debit (Owed)</TableHead>
                                            <TableHead className="text-right text-green-500">Credit (Paid)</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledger.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{entry.date}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                                                <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(entry.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {ledger.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                                                    No ledger entries found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="banks" className="mt-0">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Bank Details</CardTitle>
                                    <CardDescription>Manage multiple bank accounts for this client.</CardDescription>
                                </div>
                                <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                                    <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 transition-colors focus:outline-none">
                                        <Plus className="h-4 w-4 mr-2" /> Add Bank
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Bank Account</DialogTitle>
                                            <DialogDescription>Enter account details.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddBank} className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Bank Name</label>
                                                    <Input required value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Account Title</label>
                                                    <Input required value={bankForm.account_title} onChange={e => setBankForm({ ...bankForm, account_title: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Account Number</label>
                                                    <Input required value={bankForm.account_number} onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Currency</label>
                                                    <Input required value={bankForm.currency} onChange={e => setBankForm({ ...bankForm, currency: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">IBAN</label>
                                                    <Input value={bankForm.iban} onChange={e => setBankForm({ ...bankForm, iban: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">SWIFT Code</label>
                                                    <Input value={bankForm.swift_code} onChange={e => setBankForm({ ...bankForm, swift_code: e.target.value })} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit">Save Bank</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {client.banks?.map((bank: any) => (
                                        <div key={bank.id} className="border border-border rounded-xl p-5 bg-muted/20">
                                            <h3 className="font-semibold text-lg text-foreground">{bank.bank_name}</h3>
                                            <p className="text-sm text-primary mb-4 font-medium">{bank.currency}</p>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-muted-foreground">Title</span>
                                                    <span className="font-medium">{bank.account_title}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-muted-foreground">A/C Number</span>
                                                    <span className="font-medium">{bank.account_number}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-muted-foreground">IBAN</span>
                                                    <span className="font-medium">{bank.iban || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">SWIFT</span>
                                                    <span className="font-medium">{bank.swift_code || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!client.banks || client.banks.length === 0) && (
                                        <div className="col-span-full text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                                            No bank accounts added yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invoices" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoices</CardTitle>
                                <CardDescription>Billed invoices for this client.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Currency</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {client.invoices?.map((inv: any) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                                <TableCell>{inv.date}</TableCell>
                                                <TableCell>{inv.currency}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(inv.total_amount, inv.currency)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!client.invoices || client.invoices.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                                                    No invoices generated.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="vouchers" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vouchers</CardTitle>
                                <CardDescription>Accounting expense/journal transactions associated with this client.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Voucher #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {client.vouchers?.filter((v: any) => v.type !== 'receipt').map((v: any) => (
                                            <TableRow key={v.id}>
                                                <TableCell className="font-medium">{v.voucher_number}</TableCell>
                                                <TableCell>{v.date}</TableCell>
                                                <TableCell className="capitalize">{v.type}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(v.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!client.vouchers || client.vouchers.filter((v: any) => v.type !== 'receipt').length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                                                    No vouchers generated.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payments Received</CardTitle>
                                <CardDescription>Receipt vouchers recorded from this client.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Receipt #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount Received</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {client.vouchers?.filter((v: any) => v.type === 'receipt').map((v: any) => (
                                            <TableRow key={v.id}>
                                                <TableCell className="font-medium">{v.voucher_number}</TableCell>
                                                <TableCell>{v.date}</TableCell>
                                                <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(v.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!client.vouchers || client.vouchers.filter((v: any) => v.type === 'receipt').length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center p-8 text-muted-foreground">
                                                    No payments recorded yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
