<?php

namespace App\Services;

use App\Models\DocumentTemplate;
use App\Models\GeneratedDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentGeneratorService
{
    /**
     * Generate a PDF document from a template and reference model.
     *
     * @param string $documentType
     * @param mixed $referenceModel
     * @param int $userId
     * @return GeneratedDocument
     */
    public function generate($documentType, $referenceModel, $userId)
    {
        // 1. Fetch Template
        $template = DocumentTemplate::where('document_type', $documentType)
            ->where('is_default', true)
            ->first() ?? DocumentTemplate::where('document_type', $documentType)->first();

        if (!$template) {
            throw new \Exception("No template found for document type: {$documentType}");
        }

        // 2. Prepare Data
        $data = $this->prepareData($referenceModel);

        // 3. Parse Template
        $html = $this->parseTemplate($template->template_content, $data);

        // 4. Generate PDF
        $pdf = Pdf::loadHTML($html);
        
        // 5. Save File
        $fileName = $documentType . '_' . Str::random(10) . '.pdf';
        $path = 'generated_documents/' . $fileName;
        Storage::disk('public')->put($path, $pdf->output());

        // 6. Create Record
        return GeneratedDocument::create([
            'document_number' => $this->generateDocumentNumber($documentType),
            'document_type' => $template->template_name,
            'reference_type' => get_class($referenceModel),
            'reference_id' => $referenceModel->id,
            'file_path' => $path,
            'generated_by' => $userId,
        ]);
    }

    protected function prepareData($model)
    {
        // Common data
        $data = [
            'system_date' => date('Y-m-d'),
            'company_name' => 'TradePulser Logistics',
            'company_address' => 'Global Trade Center, NY',
            'company_phone' => '+1 234 567 890',
            'company_email' => 'contact@tradepulser.com',
        ];

        // Model specific mapping
        $modelName = class_basename($model);
        
        switch ($modelName) {
            case 'Invoice':
                $data['invoice_number'] = $model->invoice_number;
                $data['invoice_date'] = $model->date;
                $data['client_name'] = $model->client->company_name ?? 'N/A';
                $data['client_address'] = $model->client->address ?? 'N/A';
                $data['total_amount'] = number_format($model->total_amount, 2);
                $data['items_html'] = $this->generateItemsTable($model->items);
                break;
            
            case 'ExportOrder':
                $data['order_number'] = $model->tracking_number ?? $model->id;
                $data['invoice_number'] = $model->tracking_number ?? $model->id;
                $data['invoice_date'] = $model->departure_date ?? date('Y-m-d');
                $data['client_name'] = $model->client->company_name ?? 'N/A';
                $data['client_address'] = $model->client->address ?? 'N/A';
                $data['total_amount'] = number_format($model->total_value ?? $model->items->sum('total_price'), 2);
                $data['items_html'] = $this->generateItemsTable($model->items);
                break;

            case 'PurchaseOrder':
                $data['po_number'] = $model->po_number;
                $data['po_date'] = $model->date;
                $data['vendor_name'] = $model->vendor->name ?? 'N/A';
                $data['vendor_address'] = $model->vendor->address ?? 'N/A';
                $data['total_amount'] = number_format($model->total_amount, 2);
                $data['items_html'] = $this->generateItemsTable($model->items);
                break;
        }

        return $data;
    }

    protected function parseTemplate($content, $data)
    {
        foreach ($data as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value, $content);
        }
        return $content;
    }

    protected function generateItemsTable($items)
    {
        $html = '<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($items as $item) {
            $name = $item->product->name ?? 'N/A';
            $qty = $item->quantity ?? 0;
            $price = $item->price ?? $item->unit_price ?? 0;
            $total = $qty * $price;
            
            $html .= '<tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px;">' . $name . '</td>
                        <td style="padding: 10px; text-align: center;">' . $qty . '</td>
                        <td style="padding: 10px; text-align: right;">' . number_format($price, 2) . '</td>
                        <td style="padding: 10px; text-align: right;">' . number_format($total, 2) . '</td>
                      </tr>';
        }

        $html .= '</tbody></table>';
        return $html;
    }

    protected function generateDocumentNumber($type)
    {
        $prefix = strtoupper(substr($type, 0, 2));
        return $prefix . '-' . date('Ymd') . '-' . Str::random(4);
    }
}
