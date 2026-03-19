"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    FileText, 
    Search, 
    Download, 
    Trash2, 
    Clock, 
    Filter, 
    ExternalLink,
    FileDown,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface GeneratedDocument {
    id: number;
    document_number: string;
    document_type: string;
    reference_type: string;
    reference_id: number;
    created_at: string;
    user?: { name: string };
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data } = await api.get("/generated-documents");
            setDocuments(data);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            toast.error("Failed to load document archive");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc: GeneratedDocument) => {
        try {
            const response = await api.get(`/generated-documents/${doc.id}/download`, {
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${doc.document_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Download failed");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this document permanently?")) return;
        try {
            await api.delete(`/generated-documents/${id}`);
            setDocuments(documents.filter(d => d.id !== id));
            toast.success("Document deleted");
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const filteredDocs = documents.filter(doc => 
        doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        Document Archive
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        System-wide tracking of all automated trade documentation.
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden backdrop-blur-sm">
                <div className="p-5 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>Recent Activity</span>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by number or type..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 h-9 bg-background border-input" 
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10 hover:bg-transparent">
                                <TableHead className="w-[200px] font-bold py-4">Document #</TableHead>
                                <TableHead className="font-bold">Template Type</TableHead>
                                <TableHead className="font-bold">Linked To</TableHead>
                                <TableHead className="font-bold text-center">Generated By</TableHead>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 opacity-40" />
                                        <p className="font-medium">Decrypting archives...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3 opacity-60">
                                            <FileText className="h-12 w-12" />
                                            <p className="font-medium">No documents found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocs.map((doc) => (
                                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell className="font-mono font-black text-primary text-sm tracking-tight capitalize">
                                        {doc.document_number}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-bold bg-muted/50 border-primary/20 text-primary uppercase text-[10px]">
                                            {doc.document_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">
                                                {doc.reference_type.split('\\').pop()}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">ID: {doc.reference_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border text-xs font-bold text-muted-foreground">
                                            {doc.user?.name || 'System'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-[11px] font-medium">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                        <br />
                                        {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                                onClick={() => handleDownload(doc)}
                                            >
                                                <FileDown className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                                onClick={() => handleDelete(doc.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
