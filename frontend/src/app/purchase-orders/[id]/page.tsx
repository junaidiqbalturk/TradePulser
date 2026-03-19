"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    Truck, 
    PackageCheck, 
    FileText, 
    History,
    MoreVertical,
    Download,
    Eye,
    Receipt,
    ExternalLink,
    AlertCircle,
    ShoppingCart,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GeneratedDocumentSection } from "@/components/documents/GeneratedDocumentSection";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface POItem {
    id: number;
    product: { name: string; sku: string };
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    vendor: { id: number; company_name: string };
    order_date: string;
    expected_delivery: string;
    currency: string;
    total_amount: number;
    status: string;
    notes: string;
    creator: { name: string };
    items: POItem[];
    import_orders: any[];
    vendor_bills: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200", icon: Clock },
    approved: { label: "Approved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200", icon: CheckCircle2 },
    ordered: { label: "Ordered", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200", icon: Truck },
    received: { label: "Received", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200", icon: PackageCheck },
    completed: { label: "Completed", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200", icon: FileText },
};

export default function PODetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPO = async () => {
        try {
            const response = await api.get(`/purchase-orders/${params.id}`);
            setPo(response.data);
        } catch (error) {
            console.error("Failed to fetch PO details:", error);
            toast.error("Failed to load Purchase Order");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPO();
    }, [params.id]);

    const handleAction = async (action: string) => {
        try {
            await api.post(`/purchase-orders/${params.id}/${action}`);
            toast.success(`Purchase Order ${action} successfully`);
            fetchPO();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${action} PO`);
        }
    };

    if (isLoading) return <div className="p-8"><div className="animate-pulse space-y-8"><div className="h-12 w-1/3 bg-muted rounded"></div><div className="h-64 bg-muted rounded"></div></div></div>;
    if (!po) return <div className="p-8 text-center text-muted-foreground">PO not found.</div>;

    const currentStatus = statusConfig[po.status] || statusConfig.draft;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency }).format(amount || 0);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-20 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/purchase-orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase">
                                Purchase Order: <span className="text-primary">{po.po_number}</span>
                            </h1>
                            <Badge className={cn("px-3 py-1 font-black text-[10px] tracking-widest uppercase border border-border shadow-sm", currentStatus.color)}>
                                <currentStatus.icon className="mr-1.5 h-3 w-3" />
                                {currentStatus.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Created on {po.order_date} by <span className="text-foreground font-bold">{po.creator.name}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {po.status === 'draft' && (
                        <Button onClick={() => handleAction('approve')} className="flex-1 md:flex-none font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve PO
                        </Button>
                    )}
                    {po.status === 'approved' && (
                        <Button onClick={() => handleAction('mark-ordered')} className="flex-1 md:flex-none font-bold shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700">
                            <Truck className="mr-2 h-4 w-4" />
                            Mark as Ordered
                        </Button>
                    )}
                    {po.status === 'ordered' && (
                        <Button onClick={() => handleAction('complete')} className="flex-1 md:flex-none font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700">
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Mark Received
                        </Button>
                    )}
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-10 w-10 border border-border rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors">
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" /> Print PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" /> Export Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Left Side: Info & Items */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="pl-6 font-bold py-3 text-xs uppercase text-muted-foreground">Product</TableHead>
                                        <TableHead className="font-bold py-3 text-xs uppercase text-muted-foreground">SKU</TableHead>
                                        <TableHead className="font-bold py-3 text-xs uppercase text-muted-foreground text-center">Qty</TableHead>
                                        <TableHead className="font-bold py-3 text-xs uppercase text-muted-foreground text-right">Unit Price</TableHead>
                                        <TableHead className="font-bold py-3 text-xs uppercase text-muted-foreground text-right pr-6">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {po.items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/10">
                                            <TableCell className="pl-6 font-bold text-foreground py-4">{item.product.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                                            <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-black text-foreground pr-6">{formatCurrency(item.total_price)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-6 bg-muted/20 flex justify-end">
                                <div className="w-64 space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground uppercase tracking-wider font-bold">Subtotal</span>
                                        <span className="font-bold">{formatCurrency(po.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border">
                                        <span className="text-lg font-black uppercase tracking-tighter">Grand Total</span>
                                        <span className="text-2xl font-black text-primary">{formatCurrency(po.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="bg-muted/10 border-b border-border">
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Generated Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <GeneratedDocumentSection 
                                referenceType="PurchaseOrder" 
                                referenceId={po.id} 
                                availableTypes={[
                                    { label: "Purchase Order PDF", value: "po" }
                                ]}
                            />
                        </CardContent>
                    </Card>
                    
                    {po.notes && (
                        <Card className="border-border shadow-sm border-l-4 border-l-primary">
                            <CardHeader className="bg-muted/10 pb-2">
                                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-foreground leading-relaxed italic">"{po.notes}"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Side: Vendor & Linked Docs */}
                <div className="space-y-8">
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-primary text-primary-foreground">
                            <CardTitle className="text-lg">Vendor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Supplier Name</Label>
                                <div className="text-lg font-black text-foreground">{po.vendor.company_name}</div>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Currency</Label>
                                    <div className="font-bold text-primary">{po.currency}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Delivery Date</Label>
                                    <div className="font-bold text-foreground">{po.expected_delivery || 'Not Set'}</div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="w-full mt-4 font-bold border-primary/20 text-primary hover:bg-primary/5">
                                <Link href={`/vendors/${po.vendor.id}`}>
                                    View Vendor Profile
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border">
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Linked Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {po.import_orders.length === 0 && po.vendor_bills.length === 0 && (
                                    <div className="p-8 text-center text-xs text-muted-foreground italic font-medium">
                                        No linked transactions found.
                                    </div>
                                )}
                                {po.import_orders.map((imp) => (
                                    <Link key={imp.id} href={`/import-orders/${imp.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Truck className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">IM-{imp.tracking_number || imp.id}</p>
                                                <p className="text-[10px] uppercase font-black text-muted-foreground">Import Order</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                                    </Link>
                                ))}
                                {po.vendor_bills.map((bill) => (
                                    <Link key={bill.id} href={`/vendor-bills/${bill.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <Receipt className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{bill.bill_number}</p>
                                                <p className="text-[10px] uppercase font-black text-muted-foreground">Vendor Bill</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 dark:bg-orange-950/20 dark:border-orange-800/30">
                        <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400">Inventory Notice</h4>
                            <p className="text-xs text-orange-700/80 dark:text-orange-500/70 font-medium leading-tight mt-1">
                                Stock levels will automatically increase once the linked Import Order is marked as "Arrived".
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
