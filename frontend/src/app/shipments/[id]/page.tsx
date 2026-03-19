"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Ship, ArrowLeft, ArrowRight, Anchor, MapPin, Calendar, Clock, Map, Package, Activity, AlertCircle, Plus, ExternalLink, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

export default function ShipmentDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Event modal state
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ event: "", location: "", event_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm') });
    const [addingEvent, setAddingEvent] = useState(false);

    // Status update state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    const statuses = [
        'Draft', 
        'Booked', 
        'In Transit', 
        'Arrived at Port', 
        'Customs Clearance', 
        'Delivered'
    ];

    useEffect(() => {
        if (id) fetchShipment();
    }, [id]);

    const fetchShipment = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/shipments/${id}`);
            setShipment(data);
        } catch (error) {
            console.error("Failed to fetch shipment details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedStatus) return;
        setUpdatingStatus(true);
        try {
            await api.put(`/shipments/${id}`, { status: selectedStatus });
            
            // Log an automatic event for the status change
            await api.post(`/shipments/${id}/events`, {
                event: `Status changed to ${selectedStatus}`,
                location: "System Update",
                event_date: new Date().toISOString()
            });

            setIsStatusModalOpen(false);
            fetchShipment();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Could not update status.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingEvent(true);
        try {
            await api.post(`/shipments/${id}/events`, newEvent);
            setIsEventModalOpen(false);
            setNewEvent({ event: "", location: "", event_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm') });
            fetchShipment(); // Refresh timeline
        } catch (error) {
            console.error("Failed to add event", error);
            alert("Could not add event. Make sure all fields are filled.");
        } finally {
            setAddingEvent(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading shipment timeline...</div>;
    }

    if (!shipment) {
        return (
            <div className="p-12 text-center text-rose-500 flex flex-col items-center gap-4">
                <AlertCircle className="h-10 w-10" />
                <h2 className="text-xl font-bold">Shipment Not Found</h2>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const orderLink = shipment.type === 'import' ? `/imports` : `/exports`;
    const orderTitle = shipment.type === 'import' ? 'Import Order' : 'Export Order';
    const orderRef = shipment.type === 'import' ? shipment.import_order : shipment.export_order;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full border-border/60">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Ship className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
                            {shipment.shipment_number}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Tracking Log & Details for {shipment.client_name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-border text-foreground" onClick={() => {
                        setSelectedStatus(shipment.status);
                        setIsStatusModalOpen(true);
                    }}>
                        <Activity className="h-4 w-4 mr-2" /> Change Status
                    </Button>
                    <Button onClick={() => setIsEventModalOpen(true)} className="shadow-md">
                        <Plus className="h-4 w-4 mr-2" /> Log Event
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Shipment Track */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Hero Info Card */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 relative">
                        <div className="absolute top-0 right-0 p-6 flex gap-2">
                            <Badge variant="outline" className={`uppercase tracking-wider font-bold ${shipment.type === 'import' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {shipment.type}
                            </Badge>
                             <Badge 
                                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                                onClick={() => {
                                    setSelectedStatus(shipment.status);
                                    setIsStatusModalOpen(true);
                                }}
                            >
                                {shipment.status}
                            </Badge>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Vessel Route</h3>
                                <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1 font-medium">
                                    <Anchor className="h-4 w-4" /> {shipment.vessel_name} <span className="opacity-50">|</span> {shipment.shipping_line}
                                </div>
                            </div>

                            <div className="flex items-center justify-between relative px-2">
                                <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-muted-foreground/20 rounded-full" />
                                
                                <div className="flex flex-col items-center gap-2 z-10 bg-card px-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">{shipment.origin_port}</p>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mt-0.5">
                                            <Calendar className="h-3 w-3" /> {shipment.etd}
                                        </p>
                                    </div>
                                </div>

                                <div className="z-10 bg-card px-2">
                                    <Ship className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                                </div>

                                <div className="flex flex-col items-center gap-2 z-10 bg-card px-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                                        <Map className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">{shipment.destination_port}</p>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mt-0.5">
                                            <Calendar className="h-3 w-3" /> {shipment.eta}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Events */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Shipment Journey Timeline
                        </h3>
                        <div className="space-y-6 relative pl-6">
                            {/* Vertical Line */}
                            <div className="absolute left-[29px] top-2 bottom-4 w-[2px] bg-muted" />

                            {shipment.events.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">No events logged yet.</p>
                            ) : (
                                shipment.events.map((ev: any, index: number) => (
                                    <div key={ev.id} className="relative z-10 flex gap-4">
                                        <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 border-2 ${index === 0 ? 'bg-primary border-primary/20 ring-4 ring-primary/10' : 'bg-muted-foreground border-muted'}`} />
                                        <div className="flex-1 pb-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold ${index === 0 ? 'text-foreground' : 'text-foreground/80'}`}>{ev.event}</h4>
                                                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap bg-muted/40 px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(ev.event_date), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                                                <MapPin className="h-3.5 w-3.5" /> {ev.location || 'System Config'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="col-span-1 space-y-6">
                    {/* Linked Order */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-24 w-24 bg-primary/5 rounded-bl-full -z-0" />
                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider text-muted-foreground mb-4 relative z-10">Attached To</h3>
                        <div className="space-y-3 relative z-10">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Company</p>
                                <p className="font-bold text-foreground">{shipment.client_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">{orderTitle}</p>
                                <Link href={orderLink} className="font-mono text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                    {orderRef?.tracking_number || `Order #${shipment.order_id}`}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Containers List */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                Freight Containers
                            </h3>
                            <Badge variant="outline" className="font-mono bg-muted">{shipment.containers.length}</Badge>
                        </div>
                        
                        <div className="space-y-3">
                            {shipment.containers.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic py-4 text-center bg-muted/20 rounded-lg border border-dashed border-border">No containers attached.</p>
                            ) : (
                                shipment.containers.map((c: any) => (
                                    <div key={c.id} className="p-3 bg-muted/30 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono font-bold text-foreground">{c.container_number}</span>
                                            {c.container_type && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5">{c.container_type}</Badge>
                                            )}
                                        </div>
                                        {c.seal_number && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase">
                                                <span>Seal:</span>
                                                <span className="font-mono">{c.seal_number}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Event Modal */}
            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent className="max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Log Shipment Event
                        </DialogTitle>
                        <DialogDescription>Add a new entry to the timeline tracking history.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddEvent} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Event Description</label>
                            <Input required placeholder="Ex: Vessel Departed" value={newEvent.event} onChange={e => setNewEvent({...newEvent, event: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Input required placeholder="Ex: Port of Shanghai" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date & Time</label>
                            <Input required type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={addingEvent}>{addingEvent ? 'Saving...' : 'Save Event'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Status Update Modal */}
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Update Shipment Status
                        </DialogTitle>
                        <DialogDescription>Move this shipment to the next stage of its journey.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Status</label>
                            <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || "")}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-border flex items-start gap-3 mt-4">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Updating the status will automatically log a "System Update" event in the shipment journey timeline.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
                            {updatingStatus ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
