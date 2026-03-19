// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    client_id: z.string().optional(),
    vendor_id: z.string().optional(),
    type: z.enum(['cash', 'payment', 'receipt', 'journal']),
    date: z.string().min(1, "Date is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    payment_method: z.enum(['cash', 'bank']),
    client_bank_id: z.string().optional(),
    vendor_bank_id: z.string().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    paid_to: z.string().optional(),
    currency: z.string().default('PKR'),
    tax_type: z.string().optional(),
});

export default function CreateVoucherPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedClientBanks, setSelectedClientBanks] = useState<any[]>([]);
    const [selectedVendorBanks, setSelectedVendorBanks] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_id: "",
            vendor_id: "",
            type: "receipt",
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            payment_method: "cash",
            client_bank_id: "",
            vendor_bank_id: "",
            reference: "",
            notes: "",
            paid_to: "",
            currency: "PKR",
            tax_type: "NONE",
        },
    });

    const watchMethod = form.watch("payment_method");
    const watchClient = form.watch("client_id");
    const watchVendor = form.watch("vendor_id");

    useEffect(() => {
        api.get("/clients").then(res => setClients(res.data)).catch(console.error);
        api.get("/vendors").then(res => setVendors(res.data)).catch(console.error);

        // Pre-fill fields if params passed via URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('vendor_id')) {
            form.setValue('vendor_id', params.get('vendor_id')!);
            form.setValue('type', 'payment');
        }
        if (params.get('amount')) {
            form.setValue('amount', parseFloat(params.get('amount')!));
        }
    }, [form]);

    useEffect(() => {
        if (watchClient) {
            api.get(`/clients/${watchClient}/banks`)
                .then(res => setSelectedClientBanks(res.data))
                .catch(console.error);
        } else {
            setSelectedClientBanks([]);
        }
    }, [watchClient]);

    useEffect(() => {
        if (watchVendor) {
            api.get(`/vendors/${watchVendor}/banks`)
                .then(res => setSelectedVendorBanks(res.data))
                .catch(console.error);
        } else {
            setSelectedVendorBanks([]);
        }
    }, [watchVendor]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setErrorMsg("");
        try {
            const payload: any = { ...values };
            if (!payload.client_id) delete payload.client_id;
            if (!payload.client_bank_id) delete payload.client_bank_id;
            if (!payload.vendor_id) delete payload.vendor_id;
            if (!payload.vendor_bank_id) delete payload.vendor_bank_id;

            await api.post("/vouchers", payload);
            router.push("/vouchers");
            router.refresh();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Failed to create voucher");
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 pb-12">
            <div className="space-y-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/vouchers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Voucher</h1>
                    </div>
                </div>

                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-foreground flex items-center gap-3 text-2xl font-semibold">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <span className="text-primary text-xl">#</span>
                            </div>
                            Record Voucher
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 text-sm">Log a new accounting transaction into the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorMsg && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{errorMsg}</div>}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">

                                <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 border-b border-border pb-2">Primary Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Voucher Type <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="receipt">Receipt Voucher</SelectItem>
                                                        <SelectItem value="payment">Payment Voucher</SelectItem>
                                                        <SelectItem value="cash">Cash Voucher</SelectItem>
                                                        <SelectItem value="journal">Journal Voucher</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <FormField control={form.control} name="currency" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="tax_type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select tax" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">No Tax</SelectItem>
                                                        <SelectItem value="GST">GST (18%)</SelectItem>
                                                        <SelectItem value="VAT">VAT (5%)</SelectItem>
                                                        <SelectItem value="WHT_SERVICES">WHT Services (10%)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 border-b border-border pb-2">Financials & Routing</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField control={form.control} name="client_id" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Client</FormLabel>
                                                <Combobox value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <ComboboxInput placeholder="Select client (optional)" />
                                                    </FormControl>
                                                    <ComboboxContent className="max-h-[300px] z-[100]">
                                                        <ComboboxEmpty>No client found.</ComboboxEmpty>
                                                        <ComboboxList>
                                                            <ComboboxItem value="">None</ComboboxItem>
                                                            {clients.map((c) => (
                                                                <ComboboxItem key={c.id} value={c.id.toString()}>
                                                                    {c.company_name}
                                                                </ComboboxItem>
                                                            ))}
                                                        </ComboboxList>
                                                    </ComboboxContent>
                                                </Combobox>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="vendor_id" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vendor / Supplier</FormLabel>
                                                <Combobox value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <ComboboxInput placeholder="Select vendor (optional)" />
                                                    </FormControl>
                                                    <ComboboxContent className="max-h-[300px] z-[100]">
                                                        <ComboboxEmpty>No vendor found.</ComboboxEmpty>
                                                        <ComboboxList>
                                                            <ComboboxItem value="">None</ComboboxItem>
                                                            {vendors.map((v) => (
                                                                <ComboboxItem key={v.id} value={v.id.toString()}>
                                                                    {v.company_name}
                                                                </ComboboxItem>
                                                            ))}
                                                        </ComboboxList>
                                                    </ComboboxContent>
                                                </Combobox>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="amount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                                                <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <FormField control={form.control} name="payment_method" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Method <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Cash</SelectItem>
                                                        <SelectItem value="bank">Bank</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="reference" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference Number</FormLabel>
                                                <FormControl><Input placeholder="Cheque # / Tx ID" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {watchMethod === 'bank' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {watchClient && (
                                            <FormField control={form.control} name="client_bank_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Client Bank Account</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {selectedClientBanks.map(b => (
                                                                <SelectItem key={b.id} value={b.id.toString()}>{b.bank_name} - {b.account_number}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            )}
                                            {watchVendor && (
                                            <FormField control={form.control} name="vendor_bank_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Vendor Bank Account</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select vendor bank account" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {selectedVendorBanks.map(b => (
                                                                <SelectItem key={b.id} value={b.id.toString()}>{b.bank_name} - {b.account_number}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            )}
                                        </div>
                                    )}

                                    <FormField control={form.control} name="paid_to" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Paid To (for Payments)</FormLabel>
                                            <FormControl><Input placeholder="Vendor name or entity" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="notes" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes / Description</FormLabel>
                                            <FormControl><Textarea placeholder="Details of the transaction..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                </div>

                                <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-border">
                                    <Link href="/vouchers">
                                        <Button variant="outline" type="button" className="h-12 px-8 font-medium">Cancel</Button>
                                    </Link>
                                    <Button type="submit" className="h-12 px-8 font-bold text-white bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]">
                                        Save Transaction
                                    </Button>
                                </div>
                            </form>
                        </Form>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

