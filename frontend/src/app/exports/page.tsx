"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Plane, Search, Filter, Eye, Info, Calendar, MapPin, Package, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DocumentSection } from "@/components/documents/DocumentSection";
import { GeneratedDocumentSection } from "@/components/documents/GeneratedDocumentSection";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ExportOrder {
    id: number;
    tracking_number: string;
    client: { company_name: string; id: number } | null;
    destination: string;
    departure_date: string;
    status: string;
}

export default function ExportsPage() {
    const [orders, setOrders] = useState<ExportOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<ExportOrder | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get("/export-orders");
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (orderId: number) => {
        setDetailsLoading(true);
        setIsDetailsOpen(true);
        try {
            const { data } = await api.get(`/export-orders/${orderId}`);
            setSelectedOrder(data);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            order.tracking_number?.toLowerCase().includes(lowerQuery) ||
            order.client?.company_name?.toLowerCase().includes(lowerQuery) ||
            order.destination?.toLowerCase().includes(lowerQuery) ||
            order.status?.toLowerCase().includes(lowerQuery) ||
            order.departure_date?.toLowerCase().includes(lowerQuery)
        );
    });

    const Badge = ({ children, className }: any) => (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {children}
        </div>
    );


    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Export Orders</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage outgoing shipments and logistics.</p>
                </div>
                <Link href="/exports/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Export Order
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Plane className="h-5 w-5 text-muted-foreground" />
                        <span>All Exports</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search exports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 rounded-md bg-background" />
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tracking #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Departure Date</TableHead>
                             <TableHead>Status</TableHead>
                             <TableHead className="text-right pr-6">Actions</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">Loading orders...</TableCell>
                            </TableRow>
                        ) : filteredOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/50 transition-colors group">
                                <TableCell className="font-medium text-foreground">{order.tracking_number || 'N/A'}</TableCell>
                                <TableCell className="text-foreground">{order.client?.company_name || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{order.destination || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{order.departure_date || 'N/A'}</TableCell>
                                 <TableCell>
                                     <Badge className={`capitalize ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                             order.status === 'shipped' ? 'bg-primary/10 text-primary dark:text-primary dark:border-primary/20' :
                                                 'bg-zinc-100 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-400'
                                         }`}>
                                         {order.status}
                                     </Badge>
                                 </TableCell>
                                 <TableCell className="text-right pr-5">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order.id)} className="h-8 text-xs font-semibold text-primary hover:bg-primary/10">
                                            <FileText className="h-3.5 w-3.5 mr-1" />
                                            Docs
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)} className="h-8 text-xs font-semibold shadow-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                            <Eye className="h-3.5 w-3.5 mr-1 text-primary" /> View
                                        </Button>
                                    </div>
                                 </TableCell>

                            </TableRow>
                        ))}
                        {!loading && filteredOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-base font-medium">No export orders found matching your search.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card border-border overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                            <Plane className="h-6 w-6 text-primary" />
                            Export Order Details
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information about this outbound shipment.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="p-12 text-center text-muted-foreground italic flex-1 flex items-center justify-center">Fetching order details...</div>
                    ) : selectedOrder ? (
                        <>
                        <div className="flex-1 overflow-y-auto text-sm">
                            <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/30 p-6 rounded-xl border border-border/50 transition-all hover:bg-muted/40 group">
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors shadow-sm">
                                            <Info className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-70">Tracking Number</p>
                                            <p className="font-mono text-lg font-bold leading-none truncate text-foreground">{selectedOrder.tracking_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors shadow-sm">
                                            <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-70">Destination</p>
                                            <p className="font-bold text-base leading-none text-foreground">{selectedOrder.destination || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors shadow-sm">
                                            <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-70">Departure Date</p>
                                            <p className="font-bold text-base leading-none text-foreground">{selectedOrder.departure_date || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors shadow-sm">
                                            <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-70">Status</p>
                                            <Badge className={`capitalize mt-0.5 ${selectedOrder.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                                {selectedOrder.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedOrder.client && (
                                <div className="border border-border rounded-xl p-5 bg-card/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 h-24 w-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl transition-all group-hover:bg-primary/10" />
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 opacity-70">Client Information</p>
                                    <p className="text-xl font-bold text-foreground">{(selectedOrder as any).client?.company_name}</p>
                                    <p className="text-sm text-muted-foreground mt-1 font-medium">Account ID: CR-{(selectedOrder as any).client?.id.toString().padStart(4, '0')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border bg-muted/10">
                            <GeneratedDocumentSection 
                                referenceType="ExportOrder" 
                                referenceId={selectedOrder.id} 
                                availableTypes={[
                                    { label: "Commercial Invoice", value: "invoice" },
                                    { label: "Packing List", value: "packing_list" }
                                ]}
                            />
                        </div>

                        <div className="p-6 border-t border-border bg-muted/5">
                            <DocumentSection documentableType="App\Models\ExportOrder" documentableId={selectedOrder.id} />
                        </div>
                        </div>
                    </>
                    ) : null}
                    <div className="p-4 border-t border-border bg-muted/40 flex justify-end shrink-0">
                        <Button variant="outline" className="font-bold" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>
    );
}
