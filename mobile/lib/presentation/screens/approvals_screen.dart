import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/constants.dart';
import '../state/auth_state.dart';
import '../../core/api_client.dart';

class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiClient _api = ApiClient();
  
  List<dynamic> _pendingInvoices = [];
  List<dynamic> _pendingVouchers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchApprovals();
  }

  Future<void> _fetchApprovals() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.get('/invoices'), // Filter for pending in UI or backend if available
        _api.get('/vouchers/pending'),
      ]);

      setState(() {
        _pendingInvoices = (results[0].data as List).where((i) => i['status'] == 'pending').toList();
        _pendingVouchers = results[1].data as List;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.rose));
      }
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('APPROVAL CENTER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 2, color: Colors.white)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 4,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.white24,
          tabs: [
            Tab(text: "INVOICES (${_pendingInvoices.length})"),
            Tab(text: "VOUCHERS (${_pendingVouchers.length})"),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : TabBarView(
            controller: _tabController,
            children: [
              _buildApprovalList(_pendingInvoices, true),
              _buildApprovalList(_pendingVouchers, false),
            ],
          ),
    );
  }

  Widget _buildApprovalList(List<dynamic> items, bool isInvoice) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.checkCircle2, color: AppColors.primary.withOpacity(0.1), size: 80),
            const SizedBox(height: 16),
            const Text('ALL CLEAR', style: TextStyle(color: Colors.white24, fontWeight: FontWeight.bold, letterSpacing: 2)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return FadeInUp(
          delay: Duration(milliseconds: index * 50),
          child: _buildApprovalCard(item, isInvoice),
        );
      },
    );
  }

  Widget _buildApprovalCard(dynamic item, bool isInvoice) {
    final number = isInvoice ? item['invoice_number'] : item['voucher_number'];
    final amount = double.tryParse(item['total_amount']?.toString() ?? item['amount']?.toString() ?? '0') ?? 0;
    final entity = isInvoice 
      ? (item['client'] != null ? item['client']['company_name'] : 'Unknown Client') 
      : (item['vendor'] != null ? item['vendor']['company_name'] : (item['client'] != null ? item['client']['company_name'] : 'External Entity'));

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(number, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 10)),
              ),
              Text(
                item['date'] ?? 'N/A',
                style: const TextStyle(color: Colors.white24, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(entity ?? 'Entity Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
          const SizedBox(height: 4),
          Text(
            isInvoice ? 'SALES INVOICE' : 'PAYMENT VOUCHER',
            style: TextStyle(color: AppColors.primary.withOpacity(0.5), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.0),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('REQUESTED AMOUNT', style: TextStyle(color: Colors.white10, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  Text('Rs ${amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primary)),
                ],
              ),
              Row(
                children: [
                  _buildActionButton(LucideIcons.x, Colors.redAccent.withOpacity(0.1), Colors.redAccent, () => _handleAction(item, false, isInvoice)),
                  const SizedBox(width: 12),
                  _buildActionButton(LucideIcons.check, AppColors.primary.withOpacity(0.1), AppColors.primary, () => _handleAction(item, true, isInvoice)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, Color bg, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }

  Future<void> _handleAction(dynamic item, bool approve, bool isInvoice) async {
    final user = context.read<AuthState>().user;
    final role = user?.roleName;
    final amount = double.tryParse(item['total_amount']?.toString() ?? item['amount']?.toString() ?? '0') ?? 0;

    if (approve && role == 'Accountant' && amount > 50000) {
      _showError('THRESHOLD EXCEEDED: Accountants cannot authorize amounts over 50,000 PKR.');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final endpoint = isInvoice 
        ? '/invoices/${item['id']}/${approve ? 'approve' : 'reject'}'
        : '/vouchers/${item['id']}/${approve ? 'approve' : 'reject'}';
      
      await _api.post(endpoint);
      _showSuccess(approve ? 'TRANSACTION AUTHORIZED' : 'TRANSACTION REJECTED');
      _fetchApprovals();
    } catch (e) {
      _showError('AUTHORIZATION FAILED: $e');
      setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
      backgroundColor: AppColors.rose,
      behavior: SnackBarBehavior.floating,
    ));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
    ));
  }
}
