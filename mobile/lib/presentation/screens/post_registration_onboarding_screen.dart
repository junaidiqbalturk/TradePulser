import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:liquid_swipe/liquid_swipe.dart';
import 'package:lottie/lottie.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import '../state/auth_state.dart';
import '../../core/constants.dart';

class PostRegistrationOnboardingScreen extends StatefulWidget {
  const PostRegistrationOnboardingScreen({super.key});

  @override
  State<PostRegistrationOnboardingScreen> createState() => _PostRegistrationOnboardingScreenState();
}

class _PostRegistrationOnboardingScreenState extends State<PostRegistrationOnboardingScreen> {
  int _currentPage = 0;
  final LiquidController _liquidController = LiquidController();

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: "Visionary Business Intelligence",
      description: "Master Your Global Numbers on the Go. Pulse brings your critical business KPIs into a single, high-fidelity experience.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_qpwb7qhc.json",
      color: const Color(0xFF01110A),
      icon: LucideIcons.trendingUp,
      features: ["Real-time KPI Tracking", "In-depth Performance Insight", "Critical Growth Metrics"],
    ),
    OnboardingData(
      title: "Pulse Analytics Command",
      description: "Complete visibility into your trade pulse. Add a punch line: Your business health, visualized in real-time.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_vnik8pg6.json",
      color: const Color(0xFF003E1F),
      icon: LucideIcons.barChart3,
      features: [
        "Revenue today / month",
        "Net Profit Analysis",
        "Live Receivables & Payables",
        "Real-time Cash Position",
        "AI-Driven Revenue Trend",
        "Top Performing Clients"
      ],
    ),
    OnboardingData(
      title: "Secure Edge Approvals",
      description: "Stay in control, wherever you are. Authorize high-value transactions directly from your secure mobile vault.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_yjmcreqn.json",
      color: const Color(0xFF01110A),
      icon: LucideIcons.shieldCheck,
      features: [
        "Invoices & Vouchers",
        "Payments & Transfers",
        "Complex Purchase Orders",
        "Operational Expenses"
      ],
    ),
    OnboardingData(
      title: "Mission Critical Alerts",
      description: "Real-time Push Notifications. The ultimate fail-safe for your global supply chain operations.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_6wutsrox.json",
      color: const Color(0xFFBA2D0B), // Vibrant alert color
      icon: LucideIcons.bellRing,
      features: [
        "“Invoice pending approval”",
        "“Payment overdue”",
        "“Shipment delayed”",
        "Risk detection alerts"
      ],
    ),
    OnboardingData(
      title: "Liquid Team Governance",
      description: "Manage your global workforce with precision. Scale your operations without losing control.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_u8o7ocjx.json",
      color: const Color(0xFF003E1F),
      icon: LucideIcons.users,
      features: [
        "Instant User Invitations",
        "Granular Role Assignment",
        "Seamless User Deactivation",
        "Activity Governance"
      ],
    ),
    OnboardingData(
      title: "Pulse Insight Snapshots",
      description: "Executive Summaries at your fingertips. Not full reports — just high-speed intelligence for swift decisions.",
      lottieUrl: "https://assets10.lottiefiles.com/packages/lf20_6wutsrox.json",
      color: const Color(0xFF01110A),
      icon: LucideIcons.pieChart,
      features: [
        "P&L Dynamic Snapshot",
        "Balance Sheet Summary",
        "AR/AP Aging Analysis",
        "Inventory Turnover Pulse"
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          LiquidSwipe(
            pages: _pages.map((data) => _buildPage(data)).toList(),
            liquidController: _liquidController,
            onPageChangeCallback: (page) => setState(() => _currentPage = page),
            enableSideReveal: true,
            slideIconWidget: const Icon(Icons.arrow_back_ios, color: Colors.white24),
          ),
          
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                AnimatedSmoothIndicator(
                  activeIndex: _currentPage,
                  count: _pages.length,
                  effect: const ExpandingDotsEffect(
                    activeDotColor: AppColors.primary,
                    dotColor: Colors.white24,
                    dotHeight: 6,
                    dotWidth: 6,
                    expansionFactor: 4,
                  ),
                ),
                const SizedBox(height: 32),
                if (_currentPage == _pages.length - 1)
                  FadeInUp(
                    duration: const Duration(milliseconds: 500),
                    child: ElevatedButton(
                      onPressed: () {
                        // Crucially, persistent that onboarding was seen
                        final auth = Provider.of<AuthState>(context, listen: false);
                        auth.setHasSeenOnboarding();
                        // Instead of pop, push the dashboard as the new root
                        Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.background,
                        padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        elevation: 20,
                        shadowColor: AppColors.primary.withOpacity(0.4),
                      ),
                      child: Text(
                        "ENTER DASHBOARD",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w900, letterSpacing: 1.5),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPage(OnboardingData data) {
    return Container(
      width: double.infinity,
      color: data.color,
      child: Stack(
        children: [
          // Watermark - Premium Aesthetic
          Positioned(
            right: -80,
            bottom: -50,
            child: Opacity(
              opacity: 0.05,
              child: Icon(data.icon, size: 500, color: Colors.white),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Lottie.network(
                  data.lottieUrl,
                  height: 240,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Icon(data.icon, size: 100, color: AppColors.primary.withOpacity(0.5)),
                ),
                const SizedBox(height: 40),
                FadeInLeft(
                  child: Text(
                    data.title,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FadeInRight(
                  child: Text(
                    data.description,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: Colors.white70,
                      height: 1.6,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                if (data.features != null)
                  Column(
                    children: data.features!.map((feature) => FadeInUp(
                      delay: Duration(milliseconds: 200 + (data.features!.indexOf(feature) * 100)),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle_outline, color: AppColors.primary, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              feature,
                              style: GoogleFonts.inter(
                                color: Colors.white54,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )).toList(),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final String lottieUrl;
  final Color color;
  final IconData icon;
  final List<String>? features;

  OnboardingData({
    required this.title,
    required this.description,
    required this.lottieUrl,
    required this.color,
    required this.icon,
    this.features,
  });
}
