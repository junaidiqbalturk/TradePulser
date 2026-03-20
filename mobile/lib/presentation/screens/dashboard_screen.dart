import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/constants.dart';
import '../state/auth_state.dart';
import '../../domain/entities/user.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthState>().fetchDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;
    final data = auth.dashboardData;
    final rates = auth.exchangeRates;
    final shipments = auth.shipmentsData;
    final vendor = auth.vendorData;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () => auth.fetchDashboardData(),
        backgroundColor: AppColors.surface,
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            _buildAppBar(user, rates),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (data == null)
                    _buildShimmerLoading()
                  else ...[
                    _buildSectionHeader('Live Pulse Metrics'),
                    const SizedBox(height: 16),
                    _buildMetricGrid(data, vendor),
                    const SizedBox(height: 32),
                    _buildSectionHeader('Logistics Command'),
                    const SizedBox(height: 16),
                    _buildLogisticsWidgets(shipments),
                    const SizedBox(height: 32),
                    _buildSectionHeader('Recent Financial Operations'),
                    const SizedBox(height: 16),
                    _buildRecentActivity(data['recent_transactions'] as List?),
                    const SizedBox(height: 100), // Space for bottom nav
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(User? user, Map<String, dynamic>? rates) {
    return SliverAppBar(
      expandedHeight: 180,
      backgroundColor: AppColors.background,
      floating: false,
      pinned: true,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.surface.withOpacity(0.8), AppColors.background],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.only(left: 24, right: 24, top: 60),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GLOBAL MASTER',
                          style: TextStyle(
                            color: AppColors.primary.withOpacity(0.6), 
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2.5,
                          ),
                        ),
                        Text(
                          user?.name ?? 'Secure User',
                          style: const TextStyle(
                            fontSize: 28, 
                            fontWeight: FontWeight.w900, 
                            color: Colors.white,
                            letterSpacing: -1.0,
                          ),
                        ),
                      ],
                    ),
                    _buildLogoIcon(),
                  ],
                ),
                if (rates != null) ...[
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 34,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: rates.entries.map((e) => _buildRateItem(e.key, e.value)).toList(),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRateItem(String currency, dynamic rate) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Text(
            '$currency/PKR',
            style: TextStyle(color: AppColors.text.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 8),
          Text(
            double.parse(rate.toString()).toStringAsFixed(2),
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildLogisticsWidgets(Map<String, dynamic>? shipments) {
    if (shipments == null) return const SizedBox();
    
    final widgets = [
      {'title': 'In Transit', 'value': '${shipments['in_transit'] ?? 0}', 'icon': LucideIcons.ship, 'color': AppColors.primary},
      {'title': 'Arriving', 'value': '${shipments['arriving_this_week'] ?? 0}', 'icon': LucideIcons.anchor, 'color': AppColors.emerald},
      {'title': 'Delayed', 'value': '${shipments['delayed_shipments'] ?? 0}', 'icon': LucideIcons.alertCircle, 'color': AppColors.rose},
    ];

    return SizedBox(
      height: 100,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: widgets.map((w) => _buildLogisticsCard(w)).toList(),
      ),
    );
  }

  Widget _buildLogisticsCard(Map<String, dynamic> data) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (data['color'] as Color).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(data['icon'] as IconData, color: data['color'] as Color, size: 16),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                data['value'] as String,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
              ),
              Text(
                (data['title'] as String).toUpperCase(),
                style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.text.withOpacity(0.3), letterSpacing: 1.0),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricGrid(Map<String, dynamic>? data, Map<String, dynamic>? vendor) {
    final metrics = [
      {'title': 'Revenue', 'value': _formatCurrency(data?['total_payments_received']), 'icon': LucideIcons.trendingUp, 'color': AppColors.primary},
      {'title': 'Payables', 'value': _formatCurrency(vendor?['total_payables']), 'icon': LucideIcons.creditCard, 'color': AppColors.rose},
      {'title': 'Imports', 'value': '${data?['total_imports'] ?? 0}', 'icon': LucideIcons.package, 'color': AppColors.emerald},
      {'title': 'Exports', 'value': '${data?['total_exports'] ?? 0}', 'icon': LucideIcons.send, 'color': Colors.orangeAccent},
      {'title': 'A/R', 'value': _formatCurrency(data?['total_receivable']), 'icon': LucideIcons.arrowUpRight, 'color': AppColors.primary},
      {'title': 'Open POs', 'value': '${data?['open_pos'] ?? 0}', 'icon': LucideIcons.shoppingCart, 'color': AppColors.emerald},
      {'title': 'Delivering', 'value': '${data?['pending_deliveries'] ?? 0}', 'icon': LucideIcons.truck, 'color': Colors.blueAccent},
      {'title': 'PO Total', 'value': _formatCurrency(data?['total_po_value']), 'icon': LucideIcons.fileText, 'color': AppColors.rose},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.2,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) => _buildMetricCard(metrics[index]),
    );
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'Rs 0';
    final num = double.tryParse(value.toString()) ?? 0;
    if (num >= 1000000) return 'Rs ${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return 'Rs ${(num / 1000).toStringAsFixed(1)}k';
    return 'Rs ${num.toStringAsFixed(0)}';
  }

  Widget _buildMetricCard(Map<String, dynamic> metric) {
    final title = metric['title'] as String;
    final value = metric['value'] as String;
    final icon = metric['icon'] as IconData;
    final color = metric['color'] as Color;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 5)),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Opacity(
              opacity: 0.05,
              child: Icon(icon, size: 80, color: color),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 16),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        value,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5),
                      ),
                    ),
                    Text(
                      title.toUpperCase(),
                      style: TextStyle(color: AppColors.text.withOpacity(0.3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(List? transactions) {
    if (transactions == null || transactions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.03)),
        ),
        child: Column(
          children: [
            Icon(LucideIcons.history, color: Colors.white.withOpacity(0.05), size: 40),
            const SizedBox(height: 12),
            const Text('Zero activity recorded in current pulse.', style: TextStyle(color: Colors.white24, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Column(
      children: transactions.take(5).map((t) => _buildActivityItem(t)).toList(),
    );
  }

  Widget _buildActivityItem(dynamic transaction) {
    final type = transaction['type'] ?? 'receipt';
    final amount = double.tryParse(transaction['amount']?.toString() ?? '0') ?? 0;
    final client = transaction['client']?['company_name'] ?? 'System Entity';
    final isReceipt = type == 'receipt';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.02)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (isReceipt ? AppColors.emerald : AppColors.primary).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              isReceipt ? LucideIcons.creditCard : LucideIcons.fileText,
              color: isReceipt ? AppColors.emerald : AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  client,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white, overflow: TextOverflow.ellipsis),
                ),
                const SizedBox(height: 4),
                Text(
                  transaction['voucher_number'] ?? 'N/A',
                  style: TextStyle(color: AppColors.text.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isReceipt ? '+' : ''}Rs ${amount.toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: isReceipt ? AppColors.emerald : Colors.white,
                ),
              ),
              Text(
                isReceipt ? 'INBOUND' : 'OUTBOUND',
                style: TextStyle(
                  color: (isReceipt ? AppColors.emerald : AppColors.primary).withOpacity(0.5),
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLogoIcon() {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: const Icon(LucideIcons.activity, color: AppColors.primary, size: 24),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: AppColors.surface,
      highlightColor: Colors.white.withOpacity(0.05),
      child: Column(
        children: [
          const SizedBox(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.2,
            ),
            itemCount: 4,
            itemBuilder: (context, index) => Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 11, 
            fontWeight: FontWeight.w900, 
            color: AppColors.primary.withOpacity(0.6),
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(child: Divider(color: AppColors.primary.withOpacity(0.1))),
      ],
    );
  }
}
