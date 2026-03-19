"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building, Receipt, Calendar, Code } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Vendor {
    id: number;
    company_name: string;
    currency: string;
}

export default function CreateVendorBillPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    const [vendorId, setVendorId] = useState("");
    const [billNumber, setBillNumber] = useState("");
    const [billDate, setBillDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [totalAmount, setTotalAmount] = useState("");
    const [status, setStatus] = useState("unpaid");

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await api.get('/vendors');
                setVendors(response.data);
            } catch (error) {
                console.error("Failed to fetch vendors:", error);
            }
        };
        fetchVendors();
    }, []);

    const handleVendorChange = (val: string | null) => {
        if (!val) return;
        setVendorId(val);
        const selected = vendors.find(v => v.id.toString() === val);
        if (selected && selected.currency) {
            setCurrency(selected.currency);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/vendor-bills", {
                vendor_id: parseInt(vendorId),
                bill_number: billNumber,
                bill_date: billDate,
                due_date: dueDate,
                currency: currency,
                total_amount: parseFloat(totalAmount),
                status: status
            });
            router.push(`/vendors/${vendorId}`);
        } catch (error) {
            console.error("Failed to create vendor bill", error);
            alert("Failed to create vendor bill.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/vendor-bills">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Log Vendor Bill</h1>
                    <p className="text-muted-foreground mt-2">
                        Record a new supplier invoice to update the Accounts Payable ledger.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            Bill Details
                        </CardTitle>
                        <CardDescription>Enter the invoice details received from the supplier.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-2">
                                <Label htmlFor="vendorId">Select Vendor *</Label>
                                <Select value={vendorId} onValueChange={handleVendorChange} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map(v => (
                                            <SelectItem key={v.id} value={v.id.toString()}>
                                                {v.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="billNumber">Bill / Invoice Number *</Label>
                                <Input
                                    id="billNumber"
                                    required
                                    value={billNumber}
                                    placeholder="e.g. INV-2023-001"
                                    onChange={(e) => setBillNumber(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="billDate">Bill Date *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="billDate"
                                        type="date"
                                        required
                                        className="pl-9"
                                        value={billDate}
                                        onChange={(e) => setBillDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        required
                                        className="pl-9"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency *</Label>
                                <div className="relative">
                                    <Code className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="currency"
                                        required
                                        className="pl-9"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalAmount">Total Amount *</Label>
                                <Input
                                    id="totalAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Initial Status *</Label>
                                <Select value={status} onValueChange={(val) => val && setStatus(val)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="partial">Partial Payment Made</SelectItem>
                                        <SelectItem value="paid">Fully Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Logging a bill automatically increases the vendor's liability balance (A/P).
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" asChild>
                        <Link href="/vendor-bills">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? 'Saving...' : <><Save className="h-4 w-4" /> Log Supplier Bill</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
