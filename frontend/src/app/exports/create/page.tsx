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
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { ArrowLeft, Plane } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    client_id: z.string().min(1, "Client is required"),
    tracking_number: z.string().optional(),
    destination: z.string().optional(),
    departure_date: z.string().optional(),
    status: z.string(),
    notes: z.string().optional(),
});

export default function CreateExportOrderPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_id: "",
            tracking_number: "",
            destination: "",
            departure_date: "",
            status: "pending",
            notes: "",
        },
    });

    useEffect(() => {
        api.get("/clients").then(res => setClients(res.data)).catch(console.error);
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setErrorMsg("");
        try {
            await api.post("/export-orders", values);
            window.location.href = "/exports";
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Failed to create export order");
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-12">
            <div className="space-y-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/exports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Export Order</h1>
                    </div>
                </div>

                <Card className="border border-border shadow-sm overflow-hidden rounded-xl bg-card">
                    <CardHeader className="bg-muted/40 border-b border-border">
                        <CardTitle className="text-foreground flex items-center gap-3 text-2xl font-semibold">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Plane className="text-primary h-5 w-5" />
                            </div>
                            New Export
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 text-sm">Log a new outgoing shipment for a client.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorMsg && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{errorMsg}</div>}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">

                                <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 border-b border-border pb-2">Shipment Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="client_id" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Client <span className="text-red-500">*</span></FormLabel>
                                                <Combobox value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <ComboboxInput placeholder="Search client name..." />
                                                    </FormControl>
                                                    <ComboboxContent className="max-h-[300px] z-[100]">
                                                        <ComboboxEmpty>No client found.</ComboboxEmpty>
                                                        <ComboboxList>
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

                                        <FormField control={form.control} name="tracking_number" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tracking Number</FormLabel>
                                                <FormControl><Input placeholder="e.g. TRK-987812" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="destination" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Destination</FormLabel>
                                                <FormControl><Input placeholder="e.g. Dubai, UAE" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="departure_date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Departure Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="status" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="shipped">Shipped</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="pt-2">
                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes (Optional)</FormLabel>
                                                <FormControl><Textarea placeholder="Additional shipment details, flight/vessel name..." className="min-h-[100px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-border">
                                    <Link href="/exports">
                                        <Button variant="outline" type="button" className="h-12 px-8 font-medium">Cancel</Button>
                                    </Link>
                                    <Button type="submit" className="h-12 px-8 font-bold text-white bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]">
                                        Log Export Order
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
