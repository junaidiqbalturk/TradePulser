<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    /**
     * Display a listing of the documents.
     */
    public function index(Request $request)
    {
        $query = Document::with(['documentable', 'user']);

        // Optional filtering by linked entity
        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->documentable_type)
                  ->where('documentable_id', $request->documentable_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $documents = $query->latest()->get();

        return response()->json($documents);
    }

    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,png,doc,docx,xls,xlsx|max:10240', // 10MB max
            'type' => 'required|string|max:50',
            'documentable_type' => 'required|string',
            'documentable_id' => 'required|integer',
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName(); // Make unique but keep extension
        $path = $file->storeAs('documents', $fileName); // Store securely in storage/app/documents

        $document = Document::create([
            'documentable_type' => $request->documentable_type,
            'documentable_id' => $request->documentable_id,
            'user_id' => $request->user()->id,
            'type' => $request->type,
            'file_name' => $fileName,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'file_path' => $path,
        ]);

        return response()->json($document->load('user'), 201);
    }

    /**
     * Securely download the document.
     */
    public function download(Document $document)
    {
        if (!Storage::exists($document->file_path)) {
            return response()->json(['message' => 'File not found on server'], 404);
        }

        return Storage::download($document->file_path, $document->original_name);
    }

    /**
     * Remove the specified document from storage.
     */
    public function destroy(Document $document)
    {
        if (Storage::exists($document->file_path)) {
            Storage::delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
