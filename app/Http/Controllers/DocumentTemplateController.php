<?php

namespace App\Http\Controllers;

use App\Models\DocumentTemplate;
use Illuminate\Http\Request;

class DocumentTemplateController extends Controller
{
    public function index()
    {
        return response()->json(DocumentTemplate::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_name' => 'required|string|max:255',
            'document_type' => 'required|string|max:50',
            'template_content' => 'required|string',
            'is_default' => 'boolean'
        ]);

        if ($validated['is_default'] ?? false) {
            DocumentTemplate::where('document_type', $validated['document_type'])->update(['is_default' => false]);
        }

        $template = DocumentTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function update(Request $request, DocumentTemplate $documentTemplate)
    {
        $validated = $request->validate([
            'template_name' => 'sometimes|required|string|max:255',
            'document_type' => 'sometimes|required|string|max:50',
            'template_content' => 'sometimes|required|string',
            'is_default' => 'boolean'
        ]);

        if ($validated['is_default'] ?? false) {
            DocumentTemplate::where('document_type', $documentTemplate->document_type)->update(['is_default' => false]);
        }

        $documentTemplate->update($validated);
        return response()->json($documentTemplate);
    }

    public function destroy(DocumentTemplate $documentTemplate)
    {
        $documentTemplate->delete();
        return response()->json(null, 204);
    }
}
