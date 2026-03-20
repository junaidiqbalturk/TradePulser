import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF73BA9B); // Sage/Emerald
  static const Color secondary = Color(0xFF003E1F); // Dark Forest
  static const Color accent = Color(0xFFBA2D0B); // Rusty Red (for highlights)
  static const Color background = Color(0xFF01110A); // Deep Black/Green
  static const Color surface = Color(0xFF0A1F16); // Darker Green Surface
  static const Color text = Color(0xFFD5F2E3); // Off-white Green
  static const Color textMuted = Color(0x99D5F2E3);
  static const Color emerald = Color(0xFF73BA9B);
  static const Color rose = Color(0xFFBA2D0B);
}

class AppTheme {
  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.background,
    cardColor: AppColors.surface,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.surface,
      error: AppColors.rose,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontWeight: FontWeight.bold, color: AppColors.text),
      bodyMedium: TextStyle(color: AppColors.text),
    ),
  );
}
