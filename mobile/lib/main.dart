import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'presentation/state/auth_state.dart';
import 'core/constants.dart';
import 'presentation/screens/main_navigation_shell.dart';
import 'presentation/screens/post_registration_onboarding_screen.dart';
import 'presentation/screens/login_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()..checkAuth()),
      ],
      child: const TradePulserApp(),
    ),
  );
}

class TradePulserApp extends StatelessWidget {
  const TradePulserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TradePulser',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme.copyWith(
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
      ),
      home: Consumer<AuthState>(
        builder: (context, auth, _) {
          if (auth.isInitializing) {
            return const Scaffold(
              backgroundColor: AppColors.background,
              body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            );
          }
          
          if (!auth.isAuthenticated) {
            return const LoginScreen(key: ValueKey('login'));
          }

          if (!auth.hasSeenOnboarding) {
            return const PostRegistrationOnboardingScreen();
          }

          return const MainNavigationShell(key: ValueKey('main_shell'));
        },
      ),
    );
  }
}
