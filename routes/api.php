<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientBankController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImportOrderController;
use App\Http\Controllers\ImportOrderItemController;
use App\Http\Controllers\ExportOrderItemController;
use App\Http\Controllers\ExportOrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LandedCostController;
use App\Http\Controllers\FinancialReportController;
use App\Http\Controllers\ReconciliationController;
use App\Http\Controllers\AgingReportController;
use App\Http\Controllers\VoucherApprovalController;
use App\Http\Controllers\FinancialStatementController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorBillController;
use App\Http\Controllers\VendorLedgerController;
use App\Http\Controllers\VendorDashboardController;
use App\Http\Controllers\VendorBankController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\DocumentTemplateController;
use App\Http\Controllers\GeneratedDocumentController;
use App\Http\Controllers\AnalyticsController;

Route::post('/login', [AuthController::class , 'login']);
Route::post('/register-company', [AuthController::class, 'registerCompany']);

// Temporary cleanup route for Modulytica - Delete after use
Route::get('/cleanup-modulytica', function (Request $request) {
    if ($request->query('secret') !== 'pulsar_cleanup_2026') {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    $email = 'junaidiqbal@modulytica.com';
    $companyName = 'Modulytica';

    DB::transaction(function () use ($email, $companyName) {
        // Delete users with this email
        \App\Models\User::where('email', $email)->delete();
        // Delete company by name
        \App\Models\Company::where('company_name', $companyName)->delete();
    });

    return response()->json(['message' => 'Modulytica data cleaned up successfully']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load(['role.permissions', 'company']);
    });
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::post('/complete-onboarding', [AuthController::class, 'completeOnboarding']);
    
    // Company Management
    Route::get('/company', [CompanyController::class, 'show']);
    Route::put('/company', [CompanyController::class, 'update']);
    Route::post('/company/logo', [CompanyController::class, 'uploadLogo']);

    Route::apiResource('clients', ClientController::class)->middleware('permission:view_clients');
    Route::post('clients', [ClientController::class, 'store'])->middleware('permission:create_clients');
    Route::delete('clients/{client}', [ClientController::class, 'destroy'])->middleware('permission:delete_clients');
    Route::apiResource('clients.banks', ClientBankController::class)->shallow();

    Route::post('invoices/{invoice}/approve', [InvoiceController::class, 'approve'])->middleware('permission:approve_invoices');
    Route::post('invoices/{invoice}/reject', [InvoiceController::class, 'reject'])->middleware('permission:approve_invoices');
    Route::apiResource('invoices', InvoiceController::class)->middleware('permission:view_invoices');
    Route::post('invoices', [InvoiceController::class, 'store'])->middleware('permission:create_invoices');
    
    // Specific voucher routes must come before the resource route
    Route::get('vouchers/pending', [VoucherApprovalController::class, 'getPending']);
    Route::get('vouchers/unreconciled', [ReconciliationController::class, 'getUnreconciledVouchers']);
    
    Route::apiResource('vouchers', VoucherController::class)->middleware('permission:view_vouchers');
    Route::post('vouchers', [VoucherController::class, 'store'])->middleware('permission:create_vouchers');

    Route::get('ledgers/client/{client}', [LedgerController::class , 'clientLedger']);
    Route::get('dashboard', [DashboardController::class , 'index']);
    Route::get('exchange-rates', [DashboardController::class, 'exchangeRates']);

    Route::apiResource('import-orders', ImportOrderController::class);
    Route::apiResource('export-orders', ExportOrderController::class);
    Route::apiResource('import-orders.items', ImportOrderItemController::class);
    Route::apiResource('export-orders.items', ExportOrderItemController::class);
    Route::apiResource('import-orders.landed-costs', LandedCostController::class);
    Route::get('import-orders/{importOrder}/margin-analysis', [LandedCostController::class, 'marginAnalysis']);
    
    Route::get('reports/dual-currency/{client}', [FinancialReportController::class, 'dualCurrencyReport']);
    Route::get('reports/exchange-gain-loss', [FinancialReportController::class, 'exchangeGainLossReport']);

    Route::post('reconciliation/match', [ReconciliationController::class, 'match']);
    Route::get('reconciliation/unreconciled-vouchers', [ReconciliationController::class, 'getUnreconciledVouchers']);
    Route::get('reconciliation/outstanding-invoices', [ReconciliationController::class, 'getOutstandingInvoices']);
    Route::get('reports/aging-summary', [AgingReportController::class, 'agingSummary']);
    Route::get('reports/aging', [AgingReportController::class, 'agingSummary']);

    Route::post('vouchers/{voucher}/approve', [VoucherApprovalController::class, 'approve'])->middleware('permission:approve_vouchers');
    Route::post('vouchers/{voucher}/reject', [VoucherApprovalController::class, 'reject'])->middleware('permission:approve_vouchers');

    Route::get('reports/trial-balance', [FinancialStatementController::class, 'trialBalance']);
    Route::get('reports/profit-loss', [FinancialStatementController::class, 'profitAndLoss']);
    Route::get('reports/balance-sheet', [FinancialStatementController::class, 'balanceSheet']);
    Route::get('accounts', [FinancialStatementController::class, 'accounts']);
    Route::get('journal-registry', [FinancialStatementController::class, 'journalRegistry']);

    Route::get('exchange-rates/current', [ExchangeRateController::class, 'current']);
    Route::post('exchange-rates/refresh', [ExchangeRateController::class, 'refresh']);

    // Inventory & Warehouse Management
    Route::apiResource('products', ProductController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('inventory/stock', [InventoryController::class, 'getStockOverview']);
    Route::get('inventory/transactions', [InventoryController::class, 'getTransactionHistory']);

    // Document Management System
    Route::get('documents/{document}/download', [DocumentController::class, 'download']);
    Route::apiResource('documents', DocumentController::class);

    // Shipment & Logistics Tracking
    Route::get('shipments/dashboard-info', [ShipmentController::class, 'dashboardInfo']);
    Route::post('shipments/{shipment}/events', [ShipmentController::class, 'storeEvent']);
    Route::apiResource('shipments', ShipmentController::class);

    // Supplier & Vendor Management
    Route::get('vendors/dashboard-info', [VendorDashboardController::class, 'getStats']);
    Route::get('vendors/{vendor}/ledger', [VendorLedgerController::class, 'show']);
    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('vendors.banks', VendorBankController::class)->shallow();
    Route::apiResource('vendor-bills', VendorBillController::class);

    // Purchase Orders & Procurement
    Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->middleware('permission:approve_pos');
    Route::post('purchase-orders/{purchaseOrder}/mark-ordered', [PurchaseOrderController::class, 'markOrdered'])->middleware('permission:create_pos');
    Route::post('purchase-orders/{purchaseOrder}/complete', [PurchaseOrderController::class, 'complete'])->middleware('permission:approve_pos');
    Route::apiResource('purchase-orders', PurchaseOrderController::class)->middleware('permission:view_pos');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:create_pos');

    // Admin & RBAC Management
    Route::get('roles/permissions', [RoleController::class, 'permissions'])->middleware('permission:manage_roles');
    Route::apiResource('roles', RoleController::class)->middleware('permission:manage_roles');
    Route::get('admin/users', [AdminUserController::class, 'index'])->middleware('permission:manage_users');
    Route::post('admin/users', [AdminUserController::class, 'store'])->middleware('permission:manage_users');
    Route::post('admin/users/invite', [AdminUserController::class, 'invite'])->middleware('permission:manage_users');
    Route::put('admin/users/{user}', [AdminUserController::class, 'update'])->middleware('permission:manage_users');
    Route::delete('admin/users/{user}', [AdminUserController::class, 'destroy'])->middleware('permission:manage_users');

    // Automated Document Generation
    Route::apiResource('document-templates', DocumentTemplateController::class)->middleware('permission:manage_documents');
    Route::get('generated-documents', [GeneratedDocumentController::class, 'index'])->middleware('permission:view_documents');
    Route::post('generated-documents/generate', [GeneratedDocumentController::class, 'generate'])->middleware('permission:create_documents');
    Route::get('generated-documents/{generatedDocument}/download', [GeneratedDocumentController::class, 'download'])->middleware('permission:view_documents');
    Route::delete('generated-documents/{generatedDocument}', [GeneratedDocumentController::class, 'destroy'])->middleware('permission:delete_documents');
    Route::post('generated-documents/{generatedDocument}/regenerate', [GeneratedDocumentController::class, 'regenerate'])->middleware('permission:create_documents');

    // Business Intelligence & Analytics
    Route::group(['prefix' => 'analytics'], function () {
        Route::get('revenue', [AnalyticsController::class, 'getRevenueByMonth']);
        Route::get('revenue-by-client', [AnalyticsController::class, 'getRevenueByClient']);
        Route::get('product-performance', [AnalyticsController::class, 'getProductPerformance']);
        Route::get('shipment-profitability', [AnalyticsController::class, 'getShipmentProfitability']);
        Route::get('ar-aging', [AnalyticsController::class, 'getArAging']);
        Route::get('ap-aging', [AnalyticsController::class, 'getApAging']);
        Route::get('inventory-insights', [AnalyticsController::class, 'getInventoryInsights']);
        Route::get('kpis', [AnalyticsController::class, 'getKpis']);
    });
});
