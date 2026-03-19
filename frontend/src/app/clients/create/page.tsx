"use client";

import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    contact_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),
});

export default function CreateClientPage() {
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company_name: "",
            contact_person: "",
            phone: "",
            email: "",
            address: "",
            country: "",
            notes: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setErrorMsg("");
        try {
            // transform empty strings for optional fields
            const payload = { ...values };
            if (!payload.email) delete payload.email;

            await api.post("/clients", payload);
            router.push("/clients");
            router.refresh();
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Failed to create client");
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
            <div className="space-y-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add New Client</h1>
                    </div>
                </div>

                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-foreground">Client Information</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 text-sm">Enter the details of the new business client.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorMsg && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{errorMsg}</div>}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="company_name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input placeholder="ABC Traders" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="contact_person" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input placeholder="contact@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="country" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl><Input placeholder="United Kingdom" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl><Textarea placeholder="Full address" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl><Textarea placeholder="Any additional details..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="flex justify-end gap-4 mt-6">
                                    <Link href="/clients">
                                        <Button variant="outline" type="button">Cancel</Button>
                                    </Link>
                                    <Button type="submit">Save Client</Button>
                                </div>
                            </form>
                        </Form>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

