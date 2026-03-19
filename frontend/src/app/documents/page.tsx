"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Trash2, FolderOpen, FileText, Loader2, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Document {
    id: number;
    type: string;
    original_name: string;
    size: number;
    user: { id: number, name: string };
    created_at: string;
    documentable_type: string;
    documentable_id: number;
}

const DOCUMENT_TYPES = [
    "BL", "Packing List", "Commercial Invoice", "Proforma Invoice",
    "LC", "Insurance Certificate", "Customs Declaration", 
    "Supplier Invoice", "Shipping Documents", "Contracts", "Other"
];

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DocumentsPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, typeFilter]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (searchQuery) params.search = searchQuery;
            if (typeFilter && typeFilter !== "all") params.type = typeFilter;

            const response = await api.get('/documents', { params });
            setDocuments(response.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
            alert("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (docId: number, originalName: string) => {
        try {
            const response = await api.get(`/documents/${docId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            alert("There was an error while downloading the file.");
        }
    };

    const handleDelete = async (docId: number) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/documents/${docId}`);
            setDocuments(documents.filter(d => d.id !== docId));
            alert("Document deleted successfully.");
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete document.");
        }
    };

    return (
        <div className="p-4 md:p-6 2xl:p-10 max-w-screen-xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        Document Center
                    </h2>
                    <p className="text-muted-foreground mt-1">Manage all trade and business documents centrally.</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col gap-4 p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by file name or type..." 
                            className="pl-10 pb-2 h-12 bg-background/50 border-border"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-64 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
                            <SelectTrigger className="h-12 border-border bg-background/50">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {DOCUMENT_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="py-4">File Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Linked To</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No documents found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc.id} className="group hover:bg-muted/30">
                                        <TableCell className="font-semibold text-foreground py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <span className="truncate max-w-[200px]" title={doc.original_name}>
                                                    {doc.original_name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border">
                                                {doc.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-foreground">
                                                {doc.documentable_type.split('\\').pop()} #{doc.documentable_id}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-medium">
                                            {formatBytes(doc.size)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-muted-foreground">by {doc.user?.name || "Unknown"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDownload(doc.id, doc.original_name)}
                                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
