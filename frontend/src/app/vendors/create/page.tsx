"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building, MapPin, Banknote, ListPlus } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateVendorPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [vendorCode, setVendorCode] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("");
    const [taxId, setTaxId] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [currency, setCurrency] = useState("USD");

    // Dynamic Banks array
    const [banks, setBanks] = useState([{ bank_name: '', account_title: '', account_number: '', iban: '', swift_code: '' }]);

    const addBank = () => {
        setBanks([...banks, { bank_name: '', account_title: '', account_number: '', iban: '', swift_code: '' }]);
    };

    const removeBank = (index: number) => {
        setBanks(banks.filter((_, i) => i !== index));
    };

    const handleBankChange = (index: number, field: string, value: string) => {
        const updatedBanks = [...banks];
        updatedBanks[index] = { ...updatedBanks[index], [field]: value };
        setBanks(updatedBanks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Filter out empty banks
        const activeBanks = banks.filter(b => b.bank_name && b.account_number);

        try {
            const response = await api.post("/vendors", {
                vendor_code: vendorCode,
                company_name: companyName,
                contact_person: contactPerson,
                phone: phone,
                email: email,
                address: address,
                country: country,
                tax_id: taxId,
                payment_terms: paymentTerms,
                currency: currency,
                banks: activeBanks
            });
            router.push(`/vendors/${response.data.id}`);
        } catch (error) {
            console.error("Failed to create vendor", error);
            alert("Failed to create vendor. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/vendors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Vendor</h1>
                    <p className="text-muted-foreground mt-2">
                        Register a new supplier profile and their bank accounts.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="vendorCode">Vendor Code *</Label>
                                <Input
                                    id="vendorCode"
                                    required
                                    value={vendorCode}
                                    placeholder="e.g. V-001"
                                    onChange={(e) => setVendorCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input
                                    id="contactPerson"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID / VAT No</Label>
                                <Input
                                    id="taxId"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Billing details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Location & Billing Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Default Currency</Label>
                                <Input
                                    id="currency"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    placeholder="USD, EUR, PKR"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentTerms">Payment Terms</Label>
                                <Input
                                    id="paymentTerms"
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    placeholder="e.g. Net 30, Partial Advance"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Banks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-primary" />
                                Bank Accounts
                            </CardTitle>
                            <CardDescription className="mt-1">Add vendor wire transfer details</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addBank}>
                            <ListPlus className="h-4 w-4 mr-2" />
                            Add Account
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {banks.map((bank, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-md relative group">
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Bank Name *</Label>
                                    <Input
                                        value={bank.bank_name}
                                        onChange={(e) => handleBankChange(index, 'bank_name', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Account Title *</Label>
                                    <Input
                                        value={bank.account_title}
                                        onChange={(e) => handleBankChange(index, 'account_title', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Account Number *</Label>
                                    <Input
                                        value={bank.account_number}
                                        onChange={(e) => handleBankChange(index, 'account_number', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-6 space-y-2">
                                    <Label>IBAN</Label>
                                    <Input
                                        value={bank.iban}
                                        onChange={(e) => handleBankChange(index, 'iban', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-5 space-y-2">
                                    <Label>SWIFT / BIC Code</Label>
                                    <Input
                                        value={bank.swift_code}
                                        onChange={(e) => handleBankChange(index, 'swift_code', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-end justify-center pb-1">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => removeBank(index)}>
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" asChild>
                        <Link href="/vendors">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? 'Saving...' : <><Save className="h-4 w-4" /> Save Vendor</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
