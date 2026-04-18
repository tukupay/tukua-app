import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:pinput/pinput.dart';
import 'app_colors.dart';

/// Reusable shadows and glassmorphism styling constants
class AppShadows {
  // Standard shadows
  static List<BoxShadow> get light => [
    BoxShadow(
      color: Colors.black.withAlpha(10),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get medium => [
    BoxShadow(
      color: Colors.black.withAlpha(25),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];

  static List<BoxShadow> get heavy => [
    BoxShadow(
      color: Colors.black.withAlpha(40),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  // Green-tinted shadows (matches app theme)
  static List<BoxShadow> get greenLight => [
    BoxShadow(
      color: HexColor(AppColors.primaryGreen).withAlpha(20),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get greenMedium => [
    BoxShadow(
      color: HexColor(AppColors.primaryGreen).withAlpha(35),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];
}

/// Glassmorphism styling helper
class GlassMorphism {
  /// Standard glassmorphism decoration
  /// Used in cards, containers throughout the app
  static BoxDecoration standard({
    double borderRadius = 16,
    Color? backgroundColor,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? Colors.white.withAlpha(100),
      border: Border.all(
        color: borderColor ?? HexColor(AppColors.lightGray),
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: AppShadows.light,
    );
  }

  /// Elevated glassmorphism with stronger shadow
  static BoxDecoration elevated({
    double borderRadius = 16,
    Color? backgroundColor,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? Colors.white.withAlpha(120),
      border: Border.all(
        color: borderColor ?? HexColor(AppColors.lightGray),
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: AppShadows.medium,
    );
  }

  /// Subtle glassmorphism with minimal opacity
  static BoxDecoration subtle({
    double borderRadius = 12,
    Color? backgroundColor,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? Colors.white.withAlpha(60),
      border: Border.all(
        color: borderColor ?? HexColor(AppColors.lightGray).withAlpha(128),
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: AppShadows.light,
    );
  }

  /// Green-themed glassmorphism (primary accent)
  static BoxDecoration greenTinted({
    double borderRadius = 16,
    int backgroundAlpha = 100,
  }) {
    return BoxDecoration(
      color: Colors.white.withAlpha(backgroundAlpha),
      border: Border.all(
        color: HexColor(AppColors.primaryGreen).withAlpha(30),
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: AppShadows.greenLight,
    );
  }

  /// Card-style glassmorphism for selectable items
  static BoxDecoration card({
    double borderRadius = 12,
    bool isSelected = false,
  }) {
    return BoxDecoration(
      color: isSelected
          ? HexColor(AppColors.lightFadedGreen)
          : Colors.white.withAlpha(100),
      border: Border.all(
        color: isSelected
            ? HexColor(AppColors.primaryGreen)
            : HexColor(AppColors.lightGray),
        width: isSelected ? 1.5 : 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: isSelected ? AppShadows.greenLight : AppShadows.light,
    );
  }

  /// Input field glassmorphism styling
  static BoxDecoration inputField({
    double borderRadius = 12,
    bool hasError = false,
    bool isFocused = false,
  }) {
    Color borderColor;
    if (hasError) {
      borderColor = HexColor(AppColors.red);
    } else if (isFocused) {
      borderColor = HexColor(AppColors.primaryGreen);
    } else {
      borderColor = HexColor(AppColors.lightGray);
    }

    return BoxDecoration(
      color: Colors.white.withAlpha(80),
      border: Border.all(color: borderColor),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: isFocused ? AppShadows.greenLight : [],
    );
  }
}

class OtpDecorations{
  static PinTheme get defaultPinTheme => PinTheme(
      height: 56,width: 50,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: HexColor('#E7EAEB')
          )
      )
  );

  static PinTheme get focusedPinTheme => PinTheme(
      height: 56,width: 50,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: HexColor('#007B5D')
          )
      )
  );
}

