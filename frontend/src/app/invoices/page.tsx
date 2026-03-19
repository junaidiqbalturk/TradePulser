"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ReceiptText, Printer, Search, Filter, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DocumentSection } from "@/components/documents/DocumentSection";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Invoice {
    id: number;
    invoice_number: string;
    client: { company_name: string };
    date: string;
    currency: string;
    total_amount: number;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDocOpen, setIsDocOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data } = await api.get("/invoices");
            setInvoices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const filteredInvoices = invoices.filter((invoice) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            invoice.invoice_number?.toLowerCase().includes(lowerQuery) ||
            invoice.client?.company_name?.toLowerCase().includes(lowerQuery) ||
            invoice.date?.toLowerCase().includes(lowerQuery) ||
            invoice.currency?.toLowerCase().includes(lowerQuery) ||
            invoice.total_amount?.toString().includes(lowerQuery)
        );
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage billing and invoices.</p>
                </div>
                <Link href="/invoices/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        <span>All Invoices</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 rounded-md bg-background" />
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
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">Loading invoices...</TableCell>
                            </TableRow>
                        ) : filteredInvoices.map((invoice) => (
                            <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors group">
                                <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                                <TableCell className="text-foreground">{invoice.client?.company_name}</TableCell>
                                <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                                <TableCell className="text-right font-bold text-foreground">
                                    {formatCurrency(invoice.total_amount, invoice.currency)}
                                </TableCell>
                                <TableCell className="text-right pr-5">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setIsDocOpen(true); }} className="h-8 text-xs font-semibold text-primary hover:bg-primary/10">
                                            <FileText className="h-3.5 w-3.5 mr-1" />
                                            Docs
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')} title="Print Invoice">
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && filteredInvoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center p-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-base font-medium">No invoices found matching your search.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
                <DialogContent className="max-w-4xl bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <FileText className="h-6 w-6 text-primary" />
                            Invoice Documents
                        </DialogTitle>
                        <DialogDescription>
                            Manage attached files for Invoice #{selectedInvoice?.invoice_number}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="mt-4">
                            <DocumentSection documentableType="App\Models\Invoice" documentableId={selectedInvoice.id} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

