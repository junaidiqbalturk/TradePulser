<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        return response()->json(PurchaseOrder::with(['vendor', 'creator'])->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'order_date' => 'required|date',
            'expected_delivery' => 'nullable|date',
            'currency' => 'required|string|size:3',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $poNumber = 'PO-' . strtoupper(uniqid());

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'vendor_id' => $validated['vendor_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery' => $validated['expected_delivery'],
                'currency' => $validated['currency'],
                'notes' => $validated['notes'],
                'created_by' => $request->user()->id,
                'status' => 'draft',
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $itemTotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $itemTotal,
                ]);
            }

            $po->update(['total_amount' => $totalAmount]);

            return response()->json($po->load('items.product'), 201);
        });
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load(['items.product', 'vendor', 'creator', 'importOrders', 'vendorBills']));
    }

    public function approve(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Only draft POs can be approved.'], 422);
        }

        $purchaseOrder->update(['status' => 'approved']);
        return response()->json($purchaseOrder);
    }

    public function markOrdered(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'approved') {
            return response()->json(['message' => 'Only approved POs can be marked as ordered.'], 422);
        }

        $purchaseOrder->update(['status' => 'ordered']);
        return response()->json($purchaseOrder);
    }

    public function complete(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->update(['status' => 'completed']);
        return response()->json($purchaseOrder);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Cannot delete a processed PO.'], 422);
        }

        $purchaseOrder->delete();
        return response()->json(['message' => 'PO deleted successfully.']);
    }
}
