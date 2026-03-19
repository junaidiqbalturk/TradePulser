"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ship, ArrowLeft, Plus, Trash2, Box } from "lucide-react";

export default function CreateShipmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    
    // Form State
    const [type, setType] = useState<'import' | 'export'>('import');
    const [orderId, setOrderId] = useState("");
    const [originPort, setOriginPort] = useState("");
    const [destinationPort, setDestinationPort] = useState("");
    const [vesselName, setVesselName] = useState("");
    const [shippingLine, setShippingLine] = useState("");
    const [etd, setEtd] = useState("");
    const [eta, setEta] = useState("");
    const [status, setStatus] = useState("Draft");
    
    // Containers State
    const [containers, setContainers] = useState([{ container_number: "", container_type: "", seal_number: "" }]);

    useEffect(() => {
        fetchOrders();
    }, [type]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'import' ? '/import-orders' : '/export-orders';
            const { data } = await api.get(endpoint);
            setOrders(data);
            setOrderId(""); // Reset selection on change
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContainer = () => {
        setContainers([...containers, { container_number: "", container_type: "", seal_number: "" }]);
    };

    const handleRemoveContainer = (index: number) => {
        if (containers.length > 1) {
            const newContainers = [...containers];
            newContainers.splice(index, 1);
            setContainers(newContainers);
        }
    };

    const handleContainerChange = (index: number, field: string, value: string) => {
        const newContainers = [...containers];
        (newContainers[index] as any)[field] = value;
        setContainers(newContainers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Filter out empty containers
            const validContainers = containers.filter(c => c.container_number.trim() !== "");
            
            await api.post("/shipments", {
                type,
                order_id: Number(orderId),
                origin_port: originPort,
                destination_port: destinationPort,
                vessel_name: vesselName,
                shipping_line: shippingLine,
                etd,
                eta,
                status,
                containers: validContainers
            });
            router.push("/shipments");
        } catch (error) {
            console.error("Failed to create shipment:", error);
            alert("Failed to create shipment. Please check inputs.");
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Ship className="h-7 w-7 text-primary" />
                        Create New Shipment
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Register a new shipment and link it to an order.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Information */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="bg-muted/30 border-b border-border pb-4">
                            <CardTitle className="text-lg font-semibold">General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label>Shipment Type</Label>
                                <Select value={type} onValueChange={(val: string | null) => val && setType(val as 'import' | 'export')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="import">Import</SelectItem>
                                        <SelectItem value="export">Export</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Link Order</Label>
                                <Select value={orderId} onValueChange={(val: string | null) => val && setOrderId(val)} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loading ? "Loading orders..." : "Select Order"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orders.map((o) => (
                                            <SelectItem key={o.id} value={o.id.toString()}>
                                                {o.tracking_number} - {o.client?.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(val: string | null) => val && setStatus(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Booked">Booked</SelectItem>
                                        <SelectItem value="In Transit">In Transit</SelectItem>
                                        <SelectItem value="Arrived at Port">Arrived at Port</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logistics & Route */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="bg-muted/30 border-b border-border pb-4">
                            <CardTitle className="text-lg font-semibold">Logistics & Route</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Origin Port</Label>
                                    <Input required placeholder="e.g. Shanghai" value={originPort} onChange={(e) => setOriginPort(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Destination Port</Label>
                                    <Input required placeholder="e.g. Karachi" value={destinationPort} onChange={(e) => setDestinationPort(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Vessel Name</Label>
                                    <Input required placeholder="e.g. MSC Aurora" value={vesselName} onChange={(e) => setVesselName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Shipping Line</Label>
                                    <Input required placeholder="e.g. Maersk" value={shippingLine} onChange={(e) => setShippingLine(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>ETD (Departure)</Label>
                                    <Input required type="date" value={etd} onChange={(e) => setEtd(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>ETA (Arrival)</Label>
                                    <Input required type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Containers */}
                <Card className="shadow-sm border-border">
                    <CardHeader className="bg-muted/30 border-b border-border pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Box className="h-5 w-5 text-muted-foreground" />
                                Containers
                            </CardTitle>
                            <CardDescription>Optionally add containers attached to this shipment</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddContainer}>
                            <Plus className="h-4 w-4 mr-1" /> Add Container
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {containers.map((container, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-muted/20 p-4 rounded-xl border border-border">
                                <div className="space-y-2 flex-1 w-full">
                                    <Label>Container Number</Label>
                                    <Input placeholder="e.g. MSCU1234567" value={container.container_number} onChange={(e) => handleContainerChange(index, "container_number", e.target.value)} />
                                </div>
                                <div className="space-y-2 flex-1 w-full">
                                    <Label>Type</Label>
                                    <Select value={container.container_type || ""} onValueChange={(val: string | null) => val && handleContainerChange(index, "container_type", val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="20FT">20FT</SelectItem>
                                            <SelectItem value="40FT">40FT</SelectItem>
                                            <SelectItem value="40HC">40HC</SelectItem>
                                            <SelectItem value="LCL">LCL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex-1 w-full">
                                    <Label>Seal Number</Label>
                                    <Input placeholder="e.g. SEAL001" value={container.seal_number} onChange={(e) => handleContainerChange(index, "seal_number", e.target.value)} />
                                </div>
                                {containers.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveContainer(index)}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={submitting || !orderId}>
                        {submitting ? "Creating..." : "Create Shipment"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
