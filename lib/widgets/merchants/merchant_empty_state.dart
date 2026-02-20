import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Empty state widget when no merchants found
class MerchantEmptyState extends StatelessWidget {
  final String message;
  final String? subtitle;

  const MerchantEmptyState({
    super.key,
    this.message = 'No merchants found',
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            height: 80,
            width: 80,
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedStore04,
              size: 36,
              color: HexColor(AppColors.primaryGreen),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            message,
            style: Blacks.regularBoldGrotesk.copyWith(fontSize: 16),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: Grays.smallestBolderPoppinsHint,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

