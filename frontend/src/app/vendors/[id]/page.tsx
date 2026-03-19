"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Edit, Building, MapPin, Mail, Phone,
    FileText, CheckCircle2, XCircle, CreditCard, Landmark, BookOpen
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { DocumentSection } from "@/components/documents/DocumentSection";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VendorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const vendorId = params.id as string;

    useEffect(() => {
        const fetchVendorData = async () => {
            try {
                const [vendorRes, ledgerRes] = await Promise.all([
                    api.get(`/vendors/${vendorId}`),
                    api.get(`/vendors/${vendorId}/ledger`)
                ]);
                setVendor(vendorRes.data);
                setLedger(ledgerRes.data);
            } catch (error) {
                console.error("Failed to load vendor data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (vendorId) fetchVendorData();
    }, [vendorId]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount || 0);
    };

    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
    }

    if (!vendor) {
        return <div className="p-8 text-center text-muted-foreground">Vendor not found</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-12 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/vendors')} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{vendor.company_name}</h1>
                            <Badge variant="outline" className="text-sm font-mono">{vendor.vendor_code}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" /> {vendor.address || 'No Address'} • {vendor.country || 'No Country'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-destructive">
                        {vendor.total_balance !== undefined ? formatCurrency(vendor.total_balance, vendor.currency) : (ledger.length > 0 ? formatCurrency(ledger[ledger.length - 1].balance, vendor.currency) : formatCurrency(0, vendor.currency))}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">

            {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto inline-flex overflow-x-auto justify-start border border-border">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background px-4">Overview</TabsTrigger>
                        <TabsTrigger value="banks" className="rounded-lg data-[state=active]:bg-background px-4">Banks ({vendor.banks?.length || 0})</TabsTrigger>
                        <TabsTrigger value="bills" className="rounded-lg data-[state=active]:bg-background px-4">Bills ({vendor.bills?.length || 0})</TabsTrigger>
                        <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-background px-4">Ledger ({ledger.length})</TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-background px-4">Documents</TabsTrigger>
                    </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Company Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                                    <p className="font-medium">{vendor.currency}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                                    <p className="font-medium">{vendor.payment_terms || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tax / VAT ID</p>
                                    <p className="font-medium">{vendor.tax_id || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary" />
                                    Contact Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Primary Contact</p>
                                    <p className="font-medium">{vendor.contact_person || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <a href={`mailto:${vendor.email}`} className="font-medium text-primary hover:underline">{vendor.email || 'N/A'}</a>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Phone
                                    </p>
                                    <a href={`tel:${vendor.phone}`} className="font-medium">{vendor.phone || 'N/A'}</a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* BANKS TAB */}
                <TabsContent value="banks" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {vendor.banks?.length === 0 ? (
                            <div className="lg:col-span-2 p-8 text-center bg-muted/20 border border-dashed rounded-lg">
                                <Landmark className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                                <p className="text-lg font-medium text-muted-foreground">No bank accounts added.</p>
                            </div>
                        ) : (
                            vendor.banks?.map((bank: any) => (
                                <Card key={bank.id}>
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <Landmark className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{bank.bank_name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase min-w-max">Account Title</p>
                                                <p className="font-medium">{bank.account_title}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase">Account Number</p>
                                                <p className="font-mono">{bank.account_number}</p>
                                            </div>
                                        </div>
                                        {bank.iban && (
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase">IBAN</p>
                                                <p className="font-mono">{bank.iban}</p>
                                            </div>
                                        )}
                                        {bank.swift_code && (
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase">SWIFT/BIC</p>
                                                <p className="font-mono">{bank.swift_code}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* BILLS TAB */}
                <TabsContent value="bills">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendor Bills</CardTitle>
                            <CardDescription>Invoices received from this supplier.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bill No.</TableHead>
                                            <TableHead>Bill Date</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendor.bills?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    No bills logged yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            vendor.bills?.map((bill: any) => (
                                                <TableRow key={bill.id}>
                                                    <TableCell className="font-medium">{bill.bill_number}</TableCell>
                                                    <TableCell>{new Date(bill.bill_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                                    <TableCell>{new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                                    <TableCell>
                                                        {bill.status === 'paid' && <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>}
                                                        {bill.status === 'partial' && <Badge className="bg-yellow-500 hover:bg-yellow-600">Partial</Badge>}
                                                        {bill.status === 'unpaid' && <Badge variant="destructive">Unpaid</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(bill.total_amount, bill.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LEDGER TAB */}
                <TabsContent value="ledger">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Vendor Ledger
                                </CardTitle>
                                <CardDescription>Tracking A/P (Liabilities vs Payments)</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground mb-1">Current Outstanding Balance</p>
                                <p className="text-2xl font-bold text-destructive">
                                    {vendor.total_balance !== undefined ? formatCurrency(vendor.total_balance, vendor.currency) : (ledger.length > 0 ? formatCurrency(ledger[ledger.length - 1].balance, vendor.currency) : formatCurrency(0, vendor.currency))}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Payment (Debit)</TableHead>
                                            <TableHead className="text-right">Liability (Credit)</TableHead>
                                            <TableHead className="text-right text-primary">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledger.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    No ledger entries exist.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            ledger.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.description}
                                                        {entry.vendorBill && <Badge variant="outline" className="ml-2 text-[10px]">Bill Ref: {entry.vendorBill.bill_number}</Badge>}
                                                        {entry.voucher && <Badge variant="outline" className="ml-2 bg-blue-50 text-[10px]">Voucher Ref: {entry.voucher.voucher_number}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600 font-medium">
                                                        {Number(entry.debit) > 0 ? formatCurrency(entry.debit, vendor.currency) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-destructive font-medium">
                                                        {Number(entry.credit) > 0 ? formatCurrency(entry.credit, vendor.currency) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(entry.balance, vendor.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DOCUMENTS TAB */}
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendor Documents</CardTitle>
                            <CardDescription>Upload and manage contracts, licenses, and NDAs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentSection documentableType="vendor" documentableId={vendor.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
