"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft, ShoppingCart, Calculator } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vendor {
    id: number;
    company_name: string;
    currency: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface OrderItem {
    product_id: string;
    quantity: number;
    unit_price: number;
}

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        vendor_id: "",
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: "",
        currency: "PKR",
        notes: "",
    });

    const [items, setItems] = useState<OrderItem[]>([
        { product_id: "", quantity: 1, unit_price: 0 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vResponse, pResponse] = await Promise.all([
                    api.get('/vendors'),
                    api.get('/products')
                ]);
                setVendors(vResponse.data);
                setProducts(pResponse.data);
            } catch (error) {
                console.error("Failed to fetch form data:", error);
                toast.error("Failed to load vendors or products");
            }
        };
        fetchData();
    }, []);

    const handleVendorChange = (id: string) => {
        const vendor = vendors.find(v => v.id.toString() === id);
        setFormData({
            ...formData,
            vendor_id: id,
            currency: vendor?.currency || "PKR"
        });
    };

    const addItem = () => {
        setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.vendor_id || items.some(i => !i.product_id || i.quantity <= 0)) {
            toast.error("Please fill all required fields correctly");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/purchase-orders', {
                ...formData,
                items
            });
            toast.success("Purchase Order created successfully as Draft");
            router.push('/purchase-orders');
        } catch (error: any) {
            console.error("Failed to create PO:", error);
            toast.error(error.response?.data?.message || "Failed to create Purchase Order");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto pb-20 relative">
             <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent z-0 rounded-xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/purchase-orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                            New Purchase Order
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Create a new procurement request</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <Card className="border-border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-lg">Order Information</CardTitle>
                        <CardDescription>Select vendor and basic order details</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider">Vendor <span className="text-destructive">*</span></Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.vendor_id}
                                onChange={(e) => handleVendorChange(e.target.value)}
                                required
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.company_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider">Order Date <span className="text-destructive">*</span></Label>
                            <Input 
                                type="date"
                                value={formData.order_date}
                                onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider">Expected Delivery</Label>
                            <Input 
                                type="date"
                                value={formData.expected_delivery}
                                onChange={(e) => setFormData({...formData, expected_delivery: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider">Currency</Label>
                            <Input 
                                value={formData.currency}
                                disabled
                                className="bg-muted font-bold text-primary"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider">Notes</Label>
                            <Input 
                                placeholder="Any special instructions or reference notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Order Items</CardTitle>
                            <CardDescription>Add products and specify quantities</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 border-primary text-primary hover:bg-primary/5 font-bold uppercase tracking-tighter">
                            <Plus className="mr-1 h-3 w-3" />
                            Add Row
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="pl-6 font-bold py-3 text-xs uppercase">Product</TableHead>
                                    <TableHead className="font-bold py-3 text-xs uppercase w-48">Quantity</TableHead>
                                    <TableHead className="font-bold py-3 text-xs uppercase w-48">Unit Price</TableHead>
                                    <TableHead className="font-bold py-3 text-xs uppercase w-48 text-right">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <select 
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Product...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                min="1"
                                                className="h-9 font-bold"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                required
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="h-9 font-bold text-emerald-600"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                required
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-black text-foreground">
                                             {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(item.quantity * item.unit_price)}
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                            <div className="w-72 space-y-1">
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Subtotal</span>
                                    <span className="font-bold text-foreground">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(calculateTotal())}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-primary" />
                                        <span className="text-lg font-black uppercase tracking-tight text-foreground">Grand Total</span>
                                    </div>
                                    <span className="text-2xl font-black text-primary animate-in fade-in zoom-in duration-500">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(calculateTotal())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-8">
                    <Button variant="ghost" asChild disabled={isLoading}>
                        <Link href="/purchase-orders">Cancel</Link>
                    </Button>
                    <Button type="submit" className="min-w-[150px] font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Order
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
