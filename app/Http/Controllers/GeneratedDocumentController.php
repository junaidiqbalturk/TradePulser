<?php

namespace App\Http\Controllers;

use App\Models\GeneratedDocument;
use App\Services\DocumentGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GeneratedDocumentController extends Controller
{
    protected $generator;

    public function __construct(DocumentGeneratorService $generator)
    {
        $this->generator = $generator;
    }

    public function index(Request $request)
    {
        $query = GeneratedDocument::with('user');

        if ($request->has('reference_type') && $request->has('reference_id')) {
            $query->where('reference_type', 'App\\Models\\' . $request->reference_type)
                  ->where('reference_id', $request->reference_id);
        }

        return response()->json($query->latest()->get());
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'document_type' => 'required|string', // e.g., 'invoice'
            'reference_type' => 'required|string', // e.g., 'Invoice'
            'reference_id' => 'required|integer',
        ]);

        $modelClass = 'App\\Models\\' . $validated['reference_type'];
        if (!class_exists($modelClass)) {
            return response()->json(['message' => 'Invalid reference type'], 422);
        }

        $model = $modelClass::findOrFail($validated['reference_id']);
        
        try {
            $document = $this->generator->generate(
                $validated['document_type'],
                $model,
                $request->user()->id
            );
            return response()->json($document->load('user'), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function download(GeneratedDocument $generatedDocument)
    {
        if (!Storage::disk('public')->exists($generatedDocument->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download(
            $generatedDocument->file_path, 
            $generatedDocument->document_number . '.pdf'
        );
    }

    public function destroy(GeneratedDocument $generatedDocument)
    {
        if (Storage::disk('public')->exists($generatedDocument->file_path)) {
            Storage::disk('public')->delete($generatedDocument->file_path);
        }
        $generatedDocument->delete();
        return response()->json(null, 204);
    }

    public function regenerate(GeneratedDocument $generatedDocument, Request $request)
    {
        $model = $generatedDocument->reference;
        if (!$model) {
            return response()->json(['message' => 'Linked record not found'], 404);
        }

        // Delete old file
        if (Storage::disk('public')->exists($generatedDocument->file_path)) {
            Storage::disk('public')->delete($generatedDocument->file_path);
        }

        try {
            // We use the same document type as before
            // We need to know which template was used. For now we just use the current default for that type.
            // Assuming document_type in GeneratedDocument is the template name or type.
            // Let's assume it's the type for now.
            
            // In a more complex system, we'd store the template_id in GeneratedDocument.
            // For now, let's just generate a fresh one.
            
            // Re-generating typically means same everything but updated data.
            $newDoc = $this->generator->generate(
                strtolower(str_replace(' ', '_', $generatedDocument->document_type)), 
                $model, 
                $request->user()->id
            );

            $generatedDocument->delete();
            return response()->json($newDoc, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
