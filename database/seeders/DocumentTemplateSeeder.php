<?php

namespace Database\Seeders;

use App\Models\DocumentTemplate;
use Illuminate\Database\Seeder;

class DocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'template_name' => 'Commercial Invoice',
                'document_type' => 'invoice',
                'is_default' => true,
                'template_content' => $this->getInvoiceTemplate(),
            ],
            [
                'template_name' => 'Packing List',
                'document_type' => 'packing_list',
                'is_default' => true,
                'template_content' => $this->getPackingListTemplate(),
            ],
            [
                'template_name' => 'Purchase Order',
                'document_type' => 'po',
                'is_default' => true,
                'template_content' => $this->getPOTemplate(),
            ],
        ];

        foreach ($templates as $template) {
            DocumentTemplate::updateOrCreate(
                ['template_name' => $template['template_name']],
                $template
            );
        }
    }

    private function getInvoiceTemplate()
    {
        return '
        <style>
            body { font-family: sans-serif; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; }
            .doc-title { font-size: 32px; font-weight: bold; text-align: right; margin-top: -40px; text-transform: uppercase; color: #64748b; }
            .grid { width: 100%; margin-bottom: 30px; }
            .col { width: 50%; vertical-align: top; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 14px; margin-bottom: 10px; }
            .table-container { margin-top: 40px; }
            {{items_html}}
            .totals { margin-top: 30px; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            .total-row { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { margin-top: 100px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
        <div class="header">
            <div class="company-name">{{company_name}}</div>
            <div class="doc-title">Commercial Invoice</div>
            <div style="font-size: 12px; color: #64748b;">{{company_address}} | {{company_phone}}</div>
        </div>

        <table class="grid">
            <tr>
                <td class="col">
                    <div class="label">Bill To:</div>
                    <div class="value" style="font-size: 18px; font-weight: bold;">{{client_name}}</div>
                    <div class="value">{{client_address}}</div>
                </td>
                <td class="col" style="text-align: right;">
                    <div class="label">Invoice Details:</div>
                    <div class="value"><strong>Number:</strong> {{invoice_number}}</div>
                    <div class="value"><strong>Date:</strong> {{invoice_date}}</div>
                    <div class="value"><strong>Due Date:</strong> {{invoice_date}}</div>
                </td>
            </tr>
        </table>

        <div class="table-container">
            <!-- Items Table injected here -->
        </div>

        <div class="totals">
            <div class="total-row">Total Amount: PKR {{total_amount}}</div>
        </div>

        <div class="footer">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Thank you for your business!</p>
        </div>
        ';
    }

    private function getPackingListTemplate()
    {
        return '
        <style>
            body { font-family: sans-serif; color: #333; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 28px; font-weight: bold; color: #059669; }
            .doc-title { font-size: 32px; font-weight: bold; text-align: right; margin-top: -40px; text-transform: uppercase; color: #64748b; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; }
            .value { font-size: 14px; margin-bottom: 15px; }
            {{items_html}}
            .footer { margin-top: 100px; text-align: center; font-size: 12px; border-top: 1px dotted #ccc; padding-top: 20px; }
        </style>
        <div class="header">
            <div class="company-name">{{company_name}}</div>
            <div class="doc-title">Packing List</div>
        </div>

        <div style="margin-bottom: 30px;">
            <div class="label">Consignee:</div>
            <div class="value" style="font-size: 16px;">{{client_name}}<br>{{client_address}}</div>
            
            <div class="label">Order Reference:</div>
            <div class="value">{{order_number}}</div>
        </div>

        <div class="table-container">
            <!-- Items will show Product and Quantity -->
        </div>

        <div class="footer">
            <p>Weight and dimensions are as per standard shipping requirements.</p>
        </div>
        ';
    }

    private function getPOTemplate()
    {
        return '
        <style>
            body { font-family: sans-serif; color: #333; }
            .header { background-color: #f1f5f9; padding: 20px; border-left: 5px solid #0f172a; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; }
            .doc-title { font-size: 28px; font-weight: bold; color: #0f172a; margin-top: 10px; }
            {{items_html}}
            .totals { margin-top: 20px; text-align: right; font-weight: bold; font-size: 16px; }
        </style>
        <div class="header">
            <div class="company-name">{{company_name}}</div>
            <div class="doc-title">Purchase Order #{{po_number}}</div>
            <div style="font-size: 12px;">Date: {{po_date}}</div>
        </div>

        <div style="margin-bottom: 30px;">
            <div style="font-weight: bold; color: #64748b;">VENDOR:</div>
            <div style="font-size: 16px;">{{vendor_name}}</div>
            <div>{{vendor_address}}</div>
        </div>

        <div class="table-container">
            <!-- Items -->
        </div>

        <div class="totals">
            Grand Total: PKR {{total_amount}}
        </div>

        <div style="margin-top: 50px;">
            <p>Please acknowledge receipt of this PO.</p>
            <div style="width: 200px; border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 12px;">Authorized Signature</div>
        </div>
        ';
    }
}
