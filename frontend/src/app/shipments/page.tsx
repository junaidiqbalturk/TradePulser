"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Ship, Anchor, AlertCircle, Eye, ExternalLink, Activity, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Shipment {
    id: number;
    shipment_number: string;
    type: 'import' | 'export';
    client_name: string;
    origin_port: string;
    destination_port: string;
    vessel_name: string;
    etd: string;
    eta: string;
    status: string;
}

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Status update state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [currentShipmentId, setCurrentShipmentId] = useState<number | null>(null);

    const statuses = [
        'Draft', 
        'Booked', 
        'In Transit', 
        'Arrived at Port', 
        'Customs Clearance', 
        'Delivered'
    ];

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const { data } = await api.get("/shipments");
            setShipments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedStatus || !currentShipmentId) return;
        setUpdatingStatus(true);
        try {
            await api.put(`/shipments/${currentShipmentId}`, { status: selectedStatus });
            
            // Log an automatic event for the status change
            await api.post(`/shipments/${currentShipmentId}/events`, {
                event: `Status changed to ${selectedStatus}`,
                location: "System Update (List View)",
                event_date: new Date().toISOString()
            });

            setIsStatusModalOpen(false);
            fetchShipments();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Could not update status.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openStatusModal = (shipment: Shipment) => {
        setCurrentShipmentId(shipment.id);
        setSelectedStatus(shipment.status);
        setIsStatusModalOpen(true);
    };

    const StatusBadge = ({ shipment }: { shipment: Shipment }) => {
        const colors: Record<string, string> = {
            'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
            'Booked': 'bg-blue-100 text-blue-700 border-blue-200',
            'In Transit': 'bg-orange-100 text-orange-700 border-orange-200',
            'Arrived at Port': 'bg-purple-100 text-purple-700 border-purple-200',
            'Customs Clearance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
        const colorClass = colors[shipment.status] || 'bg-gray-100 text-gray-700 border-gray-200';
        return (
            <button 
                onClick={() => openStatusModal(shipment)}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:ring-2 hover:ring-primary/20 ${colorClass}`}
            >
                {shipment.status}
            </button>
        );
    };

    const filteredShipments = shipments.filter((shipment) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            shipment.shipment_number?.toLowerCase().includes(lowerQuery) ||
            shipment.client_name?.toLowerCase().includes(lowerQuery) ||
            shipment.origin_port?.toLowerCase().includes(lowerQuery) ||
            shipment.destination_port?.toLowerCase().includes(lowerQuery) ||
            shipment.vessel_name?.toLowerCase().includes(lowerQuery) ||
            shipment.status?.toLowerCase().includes(lowerQuery) ||
            shipment.type?.toLowerCase().includes(lowerQuery)
        );
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Ship className="h-8 w-8 text-primary" />
                        Shipments & Logistics
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track active imports and exports globally.</p>
                </div>
                <Link href="/shipments/create">
                    <Button className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Shipment
                    </Button>
                </Link>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Anchor className="h-5 w-5 text-muted-foreground" />
                        <span>All Active Shipments</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search shipments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 rounded-md bg-background" />
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
                                <TableHead className="pl-6">Shipment</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Vessel / Carrier</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>ETA</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center p-8 text-muted-foreground">Loading shipments...</TableCell>
                                </TableRow>
                            ) : filteredShipments.map((shipment) => (
                                <TableRow key={shipment.id} className="hover:bg-muted/50 transition-colors group">
                                    <TableCell className="pl-6">
                                        <Link href={`/shipments/${shipment.id}`} className="font-medium text-primary hover:underline block">
                                            {shipment.shipment_number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${shipment.type === 'import' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {shipment.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">{shipment.client_name}</TableCell>
                                    <TableCell className="text-muted-foreground font-medium">{shipment.vessel_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-foreground">{shipment.origin_port}</span>
                                            <span className="text-muted-foreground text-xs text-center">↓</span>
                                            <span className="text-foreground">{shipment.destination_port}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm font-medium">
                                        {shipment.eta ? format(new Date(shipment.eta), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge shipment={shipment} />
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Link href={`/shipments/${shipment.id}`}>
                                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                                <Eye className="h-4 w-4 mr-2" /> View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredShipments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center p-12 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-base font-medium">No shipments found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Status Update Modal */}
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="max-w-md bg-card border-border shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Activity className="h-6 w-6 text-primary" />
                            Update Shipment Status
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">Change the journey stage for {shipments.find(s => s.id === currentShipmentId)?.shipment_number}</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Next Stage</label>
                            <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || "")}>
                                <SelectTrigger className="w-full h-11">
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {statuses.map(s => (
                                        <SelectItem key={s} value={s} className="hover:bg-accent font-medium">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3 mt-4">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium capitalize">
                                This update will be recorded in the shipment journey log for tracking and audit purposes.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={() => setIsStatusModalOpen(false)} className="hover:bg-muted font-medium">Cancel</Button>
                        <Button onClick={handleUpdateStatus} disabled={updatingStatus} className="shadow-md px-6">
                            {updatingStatus ? 'Saving...' : 'Confirm Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
