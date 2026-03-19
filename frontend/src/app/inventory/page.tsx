"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    Warehouse, 
    Package, 
    History, 
    Plus, 
    ArrowUpRight, 
    ArrowDownLeft,
    Box,
    Info,
    Calendar,
    MapPin,
    Ship,
    Plane
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface StockRecord {
    id: number;
    product: {
        name: string;
        sku: string;
        unit: string;
    };
    warehouse: {
        name: string;
    };
    quantity: number;
}

interface TransactionRecord {
    id: number;
    product: {
        name: string;
        sku: string;
    };
    warehouse: {
        name: string;
    };
    type: 'in' | 'out';
    quantity: number;
    reference_type: string;
    reference_id: number;
    notes: string;
    created_at: string;
    reference?: {
        id: number;
        tracking_number?: string;
    };
}

export default function InventoryPage() {
    const [stocks, setStocks] = useState<StockRecord[]>([]);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isImportDetailsOpen, setIsImportDetailsOpen] = useState(false);
    const [isExportDetailsOpen, setIsExportDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stockRes, transRes] = await Promise.all([
                api.get("/inventory/stock"),
                api.get("/inventory/transactions")
            ]);
            setStocks(stockRes.data);
            setTransactions(transRes.data);
        } catch (error) {
            console.error("Error fetching inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number, type: 'ImportOrder' | 'ExportOrder') => {
        setDetailsLoading(true);
        setSelectedOrder(null);
        if (type === 'ImportOrder') setIsImportDetailsOpen(true);
        if (type === 'ExportOrder') setIsExportDetailsOpen(true);

        try {
            const endpoint = type === 'ImportOrder' ? `/import-orders/${id}` : `/export-orders/${id}`;
            const { data } = await api.get(endpoint);
            setSelectedOrder(data);
        } catch (error) {
            console.error(`Error fetching ${type} details:`, error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const Badge = ({ children, className }: any) => (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Inventory Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track products across all warehouses and locations.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-9" onClick={() => window.location.href = '/inventory/warehouses'}>
                        <Warehouse className="h-4 w-4 mr-2" />
                        Warehouses
                    </Button>
                    <Button variant="outline" className="h-9" onClick={() => window.location.href = '/inventory/products'}>
                        <Package className="h-4 w-4 mr-2" />
                        Products (SKUs)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <Box className="h-8 w-8 text-primary opacity-80" />
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">Active</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold">{stocks.length}</h3>
                            <p className="text-xs text-muted-foreground">Unique SKU-Warehouse pairs</p>
                        </div>
                    </CardContent>
                </Card>
                {/* Add more metric cards here if needed */}
            </div>

            <Tabs defaultValue="stock" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto inline-flex overflow-x-auto justify-start border border-border mb-6">
                    <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">
                        <Box className="h-4 w-4 mr-2" />
                        Current Stock
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">
                        <History className="h-4 w-4 mr-2" />
                        Movement History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Stock Levels</CardTitle>
                            <CardDescription>Consolidated view of all items in stock by location.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-semibold px-6 py-4">Product / SKU</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Warehouse</TableHead>
                                        <TableHead className="font-semibold px-6 py-4 text-right">Available Qty</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stocks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground px-6">
                                                No stock records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stocks.map((stock) => (
                                            <TableRow key={stock.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{stock.product.name}</div>
                                                    <div className="text-xs font-mono text-muted-foreground">{stock.product.sku}</div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                                                        <span>{stock.warehouse.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right text-lg font-bold tabular-nums">
                                                    {stock.quantity} <span className="text-xs font-normal text-muted-foreground ml-1">{stock.product.unit}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        stock.quantity > 50 ? 'bg-green-100 text-green-700' : 
                                                        stock.quantity > 0 ? 'bg-amber-100 text-amber-700' : 
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {stock.quantity > 50 ? 'Healthy' : stock.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="mt-0 outline-none">
                    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="bg-muted/40 border-b border-border">
                            <CardTitle className="text-xl">Transaction History</CardTitle>
                            <CardDescription>Audit trail of all stock movements (IN and OUT).</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-semibold px-6 py-4">Type</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Date</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Product</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Warehouse</TableHead>
                                        <TableHead className="font-semibold px-6 py-4 text-right">Qty</TableHead>
                                        <TableHead className="font-semibold px-6 py-4">Reference / Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground px-6">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((t) => (
                                            <TableRow key={t.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                        t.type === 'in' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {t.type === 'in' ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                                                        {t.type}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="text-sm">{new Date(t.created_at).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="font-medium">{t.product.name}</div>
                                                    <div className="text-xs text-muted-foreground">{t.product.sku}</div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-muted-foreground">
                                                    {t.warehouse.name}
                                                </TableCell>
                                                <TableCell className={`px-6 py-4 text-right font-bold tabular-nums ${t.type === 'in' ? 'text-green-600' : 'text-rose-600'}`}>
                                                    {t.type === 'in' ? '+' : '-'}{t.quantity}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="text-sm truncate max-w-[200px]">{t.notes}</div>
                                                    {(() => {
                                                        if (!t.reference_type) return <div className="text-xs text-muted-foreground">-</div>;
                                                        const type = t.reference_type.split('\\').pop();
                                                        if (type === 'ImportOrder') {
                                                            return (
                                                                <button onClick={() => handleViewDetails(t.reference_id, 'ImportOrder')} className="text-xs text-primary font-medium hover:underline inline-flex items-center mt-1 text-left">
                                                                    Import Order #{t.reference?.tracking_number || t.reference_id}
                                                                </button>
                                                            );
                                                        }
                                                        if (type === 'ExportOrder') {
                                                            return (
                                                                <button onClick={() => handleViewDetails(t.reference_id, 'ExportOrder')} className="text-xs text-primary font-medium hover:underline inline-flex items-center mt-1 text-left">
                                                                    Export Order #{t.reference?.tracking_number || t.reference_id}
                                                                </button>
                                                            );
                                                        }
                                                        return <div className="text-xs text-primary font-medium mt-1">{type}</div>;
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Import Order Details Modal */}
            <Dialog open={isImportDetailsOpen} onOpenChange={setIsImportDetailsOpen}>
                <DialogContent className="max-w-3xl bg-card border-border overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Ship className="h-6 w-6 text-primary" />
                            Import Order Details
                        </DialogTitle>
                        <DialogDescription>
                            Shipment tracking and itemized list.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="p-12 text-center text-muted-foreground italic">Fetching shipment details...</div>
                    ) : selectedOrder && isImportDetailsOpen ? (
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

                            <div className="p-0 max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted sticky top-0 z-10">
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
                                                    <TableCell className="pl-6 font-medium">{item.product_name || item.product?.name || 'Unknown'}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right pr-6">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(item.unit_price || item.unit_cost || 0)}</TableCell>
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
                    ) : null}
                    <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
                        <Button variant="outline" onClick={() => setIsImportDetailsOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Export Order Details Modal */}
            <Dialog open={isExportDetailsOpen} onOpenChange={setIsExportDetailsOpen}>
                <DialogContent className="max-w-2xl bg-card border-border overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                            <Plane className="h-6 w-6 text-primary" />
                            Export Order Details
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information about this outbound shipment.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="p-12 text-center text-muted-foreground italic">Fetching order details...</div>
                    ) : selectedOrder && isExportDetailsOpen ? (
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
                    ) : null}
                    <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
                        <Button variant="outline" className="font-bold" onClick={() => setIsExportDetailsOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
