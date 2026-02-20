import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

/// Empty state widget for fundraiser lists
class FundraiserEmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String subtext;

  const FundraiserEmptyState({
    super.key,
    required this.icon,
    required this.message,
    required this.subtext,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    HexColor(AppColors.primaryGreen).withAlpha(15),
                    HexColor(AppColors.brightGreen).withAlpha(10),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: HexColor(AppColors.primaryGreen).withAlpha(30),
                  width: 2,
                ),
              ),
              child: Icon(
                icon,
                size: 48,
                color: HexColor(AppColors.primaryGreen).withAlpha(150),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtext,
              style: TextStyle(
                fontSize: 14,
                color: HexColor(AppColors.darkerGray2),
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
