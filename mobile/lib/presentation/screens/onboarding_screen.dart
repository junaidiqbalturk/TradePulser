import 'package:flutter/material.dart';
import 'package:liquid_swipe/liquid_swipe.dart';
import 'package:lottie/lottie.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../../core/constants.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final controller = LiquidController();
  int currentPage = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildPage(
        color: AppColors.background,
        lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_96bov0i4.json', // Shipping 
        title: 'Track Everything',
        subtitle: 'Global logistics and cargo tracking in real-time, managed from a single command hub.',
      ),
      _buildPage(
        color: AppColors.secondary,
        lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_yzn8m9px.json', // Finance
        title: 'Finance at Hand',
        subtitle: 'From accounts receivable to automated ledgering, control your capital with precision.',
      ),
      _buildPage(
        color: const Color(0xFF0A1F16),
        lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_qpwb6pvl.json', // Pulse
        title: 'Ready to Pulse?',
        subtitle: 'Experience the next generation of supply chain intelligence. Your journey starts now.',
        isLast: true,
      ),
    ];

    return Scaffold(
      body: Stack(
        children: [
          LiquidSwipe(
            pages: pages,
            liquidController: controller,
            enableSideReveal: true,
            onPageChangeCallback: (index) => setState(() => currentPage = index),
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                AnimatedSmoothIndicator(
                  activeIndex: currentPage,
                  count: pages.length,
                  effect: const ExpandingDotsEffect(
                    activeDotColor: AppColors.primary,
                    dotColor: Colors.white24,
                    dotHeight: 8,
                    dotWidth: 8,
                  ),
                ),
                const SizedBox(height: 32),
                if (currentPage == pages.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () async {
                          await context.read<AuthState>().setHasSeenOnboarding();
                          if (mounted) {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text(
                          'GET STARTED',
                          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.white),
                        ),
                      ),
                    ),
                  )
                else
                  TextButton(
                    onPressed: () => controller.animateToPage(page: pages.length - 1),
                    child: const Text('SKIP', style: TextStyle(color: Colors.white30, letterSpacing: 1.5)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPage({
    required Color color,
    required String lottieUrl,
    required String title,
    required String subtitle,
    bool isLast = false,
  }) {
    return Container(
      color: color,
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.network(
            lottieUrl,
            height: 300,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => const Icon(Icons.rocket_launch, size: 100, color: Colors.white),
          ),
          const SizedBox(height: 60),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -1.0,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
