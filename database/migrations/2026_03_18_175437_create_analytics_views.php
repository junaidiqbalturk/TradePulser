<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Revenue by Month
        DB::statement("
            CREATE OR REPLACE VIEW revenue_by_month AS
            SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                SUM(total_amount) as total_revenue,
                COUNT(id) as invoice_count,
                company_id
            FROM invoices
            WHERE status = 'approved'
            GROUP BY DATE_FORMAT(date, '%Y-%m'), company_id
            ORDER BY month DESC
        ");

        // 2. Revenue by Client
        DB::statement("
            CREATE OR REPLACE VIEW revenue_by_client AS
            SELECT 
                c.company_name,
                c.country,
                SUM(i.total_amount) as total_revenue,
                COUNT(i.id) as invoice_count,
                i.company_id
            FROM clients c
            JOIN invoices i ON c.id = i.client_id
            WHERE i.status = 'approved'
            GROUP BY c.id, c.company_name, c.country, i.company_id
            ORDER BY total_revenue DESC
        ");

        // 3. Product Performance
        DB::statement("
            CREATE OR REPLACE VIEW product_performance AS
            SELECT 
                p.name as product_name,
                SUM(ii.qty) as quantity_sold,
                SUM(ii.total) as total_revenue,
                ii.company_id
            FROM products p
            JOIN invoice_items ii ON p.name = ii.item_name
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.status = 'approved'
            GROUP BY p.id, p.name, ii.company_id
            ORDER BY total_revenue DESC
        ");

        // 4. Shipment Profitability (Aggregated by month for now as direct link is missing)
        // Profit = Revenue - Estimated Cost (using average unit cost or similar)
        // For MVP, we'll join based on product name and estimated landed costs.
        DB::statement("
            CREATE OR REPLACE VIEW shipment_profitability AS
            SELECT 
                'Global' as scope,
                SUM(ii.total) as total_revenue,
                SUM(ii.qty * COALESCE(ioi.landed_unit_cost, 0)) as total_cost,
                SUM(ii.total - (ii.qty * COALESCE(ioi.landed_unit_cost,0))) as total_profit,
                ii.company_id
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            LEFT JOIN import_order_items ioi ON ii.item_name = ioi.product_name
            WHERE i.status = 'approved'
            GROUP BY ii.company_id
        ");

        // 5. AR Aging
        DB::statement("
            CREATE OR REPLACE VIEW ar_aging AS
            SELECT 
                c.company_name as client_name,
                i.invoice_number,
                i.total_amount,
                COALESCE(SUM(pr.amount_allocated), 0) as paid_amount,
                (i.total_amount - COALESCE(SUM(pr.amount_allocated), 0)) as outstanding_amount,
                DATEDIFF(CURDATE(), i.date) as days_past,
                i.company_id
            FROM invoices i
            JOIN clients c ON i.client_id = c.id
            LEFT JOIN payment_reconciliations pr ON i.id = pr.invoice_id
            WHERE i.status = 'approved'
            GROUP BY i.id, c.company_name, i.invoice_number, i.total_amount, i.date, i.company_id
            HAVING outstanding_amount > 0
        ");

        // 6. AP Aging
        DB::statement("
            CREATE OR REPLACE VIEW ap_aging AS
            SELECT 
                v.company_name as vendor_name,
                vb.bill_number,
                vb.total_amount,
                vb.due_date,
                DATEDIFF(CURDATE(), vb.bill_date) as days_past,
                vb.status,
                vb.company_id
            FROM vendor_bills vb
            JOIN vendors v ON vb.vendor_id = v.id
            WHERE vb.status != 'paid'
        ");

        // 7. Inventory Insights
        DB::statement("
            CREATE OR REPLACE VIEW inventory_insights AS
            SELECT 
                p.name as product_name,
                inv.quantity as current_stock,
                CASE 
                    WHEN inv.quantity < 20 THEN 'Low Stock'
                    WHEN inv.quantity > 100 THEN 'Optimal'
                    ELSE 'Normal'
                END as status,
                p.company_id
            FROM products p
            LEFT JOIN inventory_stocks inv ON p.id = inv.product_id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS revenue_by_month");
        DB::statement("DROP VIEW IF EXISTS revenue_by_client");
        DB::statement("DROP VIEW IF EXISTS product_performance");
        DB::statement("DROP VIEW IF EXISTS shipment_profitability");
        DB::statement("DROP VIEW IF EXISTS ar_aging");
        DB::statement("DROP VIEW IF EXISTS ap_aging");
        DB::statement("DROP VIEW IF EXISTS inventory_insights");
    }
};
