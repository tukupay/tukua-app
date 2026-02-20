import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';

/// CTA button for the merchants landing page
class MerchantExploreCTA extends StatelessWidget {
  const MerchantExploreCTA({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, Routes.merchants);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              HexColor(AppColors.primaryGreen),
              HexColor(AppColors.primaryGreen).withAlpha(220),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: HexColor(AppColors.primaryGreen).withAlpha(80),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              HugeIcons.strokeRoundedStore02,
              color: Colors.white,
              size: 22,
            ),
            SizedBox(width: 10),
            Text(
              'Explore Mini Apps',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(width: 8),
            Icon(
              HugeIcons.strokeRoundedArrowRight01,
              color: Colors.white,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

