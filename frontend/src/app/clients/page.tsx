"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Filter, FileText } from "lucide-react";
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

interface Client {
    id: number;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [isDocOpen, setIsDocOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data } = await api.get("/clients");
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        }
    };

    const filteredClients = clients.filter((c) => {
        if (!search) return true;
        const lowerSearch = search.toLowerCase();
        return (
            c.company_name?.toLowerCase().includes(lowerSearch) ||
            c.email?.toLowerCase().includes(lowerSearch) ||
            c.contact_person?.toLowerCase().includes(lowerSearch) ||
            c.phone?.toLowerCase().includes(lowerSearch) ||
            c.id?.toString().includes(lowerSearch)
        );
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Clients</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your business clients and view profiles.</p>
                </div>
                <Link href="/clients/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, phone, config..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 bg-background border-input focus-visible:ring-1 focus-visible:ring-ring h-9 rounded-md shadow-sm"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client ID</TableHead>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-muted/50 transition-colors group">
                                <TableCell className="font-medium text-muted-foreground pl-5">#{client.id.toString().padStart(4, '0')}</TableCell>
                                <TableCell className="font-semibold text-foreground">{client.company_name}</TableCell>
                                <TableCell className="text-foreground">{client.contact_person || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{client.email || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{client.phone || 'N/A'}</TableCell>
                                <TableCell className="text-right pr-5">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(client); setIsDocOpen(true); }} className="h-8 text-xs font-semibold text-primary hover:bg-primary/10">
                                            <FileText className="h-3.5 w-3.5 mr-1" />
                                            Docs
                                        </Button>
                                        <Link href={`/clients/${client.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" title="View Profile">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredClients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-base font-medium">No clients found matching your search.</p>
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
                            Client Documents
                        </DialogTitle>
                        <DialogDescription>
                            Manage attached contracts and files for {selectedClient?.company_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedClient && (
                        <div className="mt-4">
                            <DocumentSection documentableType="App\Models\Client" documentableId={selectedClient.id} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

