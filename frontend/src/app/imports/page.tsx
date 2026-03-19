"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Ship, Search, Filter, TrendingUp, Info, Eye, Package, Calendar, Globe as GlobeIcon, MapPin, CheckCircle2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DocumentSection } from "@/components/documents/DocumentSection";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ImportOrder {
    id: number;
    tracking_number: string;
    client: { company_name: string } | null;
    origin: string;
    expected_arrival: string;
    status: string;
    total_value?: number;
    base_currency?: string;
}

interface MarginAnalysis {
    total_landed_cost: number;
    total_sales_value: number;
    projected_profit: number;
    margin_percentage: number;
    items: any[];
}

export default function ImportsPage() {
    const [orders, setOrders] = useState<ImportOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAnalysis, setSelectedAnalysis] = useState<MarginAnalysis | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get("/import-orders");
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAnalysis = async (orderId: number) => {
        setAnalysisLoading(true);
        setIsDialogOpen(true);
        try {
            const { data } = await api.get(`/import-orders/${orderId}/margin-analysis`);
            setSelectedAnalysis(data);
        } catch (error) {
            console.error(error);
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleViewDetails = async (orderId: number) => {
        setDetailsLoading(true);
        setIsDetailsOpen(true);
        try {
            const { data } = await api.get(`/import-orders/${orderId}`);
            setSelectedOrder(data);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/import-orders/${orderId}`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
            setIsDetailsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            order.tracking_number?.toLowerCase().includes(lowerQuery) ||
            order.client?.company_name?.toLowerCase().includes(lowerQuery) ||
            order.origin?.toLowerCase().includes(lowerQuery) ||
            order.status?.toLowerCase().includes(lowerQuery) ||
            order.expected_arrival?.toLowerCase().includes(lowerQuery)
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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Import Orders</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage incoming shipments and logistics.</p>
                </div>
                <Link href="/imports/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Import Order
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Ship className="h-5 w-5 text-muted-foreground" />
                        <span>All Imports</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search imports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 rounded-md bg-background" />
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
                                <TableHead>Origin</TableHead>
                                <TableHead>Expected Arrival</TableHead>
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
                                    <TableCell className="text-muted-foreground">{order.origin || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.expected_arrival || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge className={`capitalize ${order.status === 'arrived' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                order.status === 'intransit' ? 'bg-primary/10 text-primary dark:text-primary dark:border-primary/20' :
                                                    'bg-zinc-100 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-400'
                                            }`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)} className="h-8 text-xs font-semibold shadow-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                            <Eye className="h-3.5 w-3.5 mr-1 text-primary" /> View
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleViewAnalysis(order.id)} className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Margin
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
                                            <p className="text-base font-medium">No import orders found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                            Margin Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of item-wise costs and projected margins.
                        </DialogDescription>
                    </DialogHeader>

                    {analysisLoading ? (
                        <div className="p-12 text-center text-muted-foreground">Calculating margins...</div>
                    ) : selectedAnalysis ? (
                        <div className="space-y-6 mt-4">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Landed Cost</p>
                                    <p className="text-lg sm:text-xl font-bold break-all leading-tight">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(selectedAnalysis.total_landed_cost)}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Sales Value</p>
                                    <p className="text-lg sm:text-xl font-bold break-all leading-tight">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(selectedAnalysis.total_sales_value)}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-[140px] p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Net Margin</p>
                                    <p className="text-lg sm:text-xl font-bold text-emerald-600 leading-tight">
                                        {selectedAnalysis.margin_percentage}%
                                    </p>
                                </div>
                            </div>

                            <div className="border border-border rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead className="text-right">Sales Price</TableHead>
                                            <TableHead className="text-right">Margin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedAnalysis.items.map((item: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(item.landed_cost)}</TableCell>
                                                <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(item.sales_price)}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">
                                                    {Math.round(((item.sales_price - item.landed_cost) / item.sales_price) * 100)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card border-border overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Package className="h-6 w-6 text-primary" />
                            Import Order Details
                        </DialogTitle>
                        <DialogDescription>
                            Shipment tracking and itemized list.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="p-12 text-center text-muted-foreground italic flex-1 flex items-center justify-center">Fetching shipment details...</div>
                    ) : selectedOrder ? (
                        <>
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-0 relative">
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 border-b border-border">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                            <Info className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tracking Number</p>
                                            <p className="font-mono text-lg font-bold">{selectedOrder.tracking_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Origin</p>
                                            <p className="font-semibold">{selectedOrder.origin || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Expected Arrival</p>
                                            <p className="font-semibold">{selectedOrder.expected_arrival || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                                            <Info className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Status</p>
                                            <Badge className={`capitalize ${selectedOrder.status === 'arrived' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'}`}>
                                                {selectedOrder.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="pl-6">Product</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right pr-6">Unit Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items?.length > 0 ? (
                                            selectedOrder.items.map((item: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="pl-6 font-medium">{item.product_name}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right pr-6">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(item.unit_price)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center p-8 text-muted-foreground italic">
                                                    No items listed for this order.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-border bg-muted/10">
                            <DocumentSection documentableType="App\Models\ImportOrder" documentableId={selectedOrder.id} />
                        </div>
                        </div>
                    </>
                    ) : null}
                    <div className="p-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                        <div className="flex gap-2">
                            {selectedOrder && selectedOrder.status !== 'arrived' && (
                                <Button 
                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'arrived')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark as Arrived
                                </Button>
                            )}
                            {selectedOrder && selectedOrder.status === 'pending' && (
                                <Button 
                                    variant="outline"
                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'intransit')}
                                    className="border-primary/20 text-primary hover:bg-primary/5"
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    Mark as In-Transit
                                </Button>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
