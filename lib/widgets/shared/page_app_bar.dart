import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Reusable app bar widget for pages with consistent styling
/// Used across top-up, send money, SMS top-up and similar screens
class PageAppBar extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onBack;
  final Widget? trailing;

  const PageAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.onBack,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 8, 16, 16),
        child: Row(
          children: [
            // Back button
            IconButton(
              onPressed: onBack ?? () => Navigator.pop(context),
              style: IconButton.styleFrom(
                backgroundColor: Colors.white.withAlpha(200),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: Icon(
                HugeIcons.strokeRoundedArrowLeft01,
                color: HexColor(AppColors.primaryGreen),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            // Title section
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: Blacks.regularBoldCodeNext),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: Grays.tinyPoppinsHint),
                  ],
                ],
              ),
            ),
            // Optional trailing widget
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}

