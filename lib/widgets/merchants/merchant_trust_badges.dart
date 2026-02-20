import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Trust badges row for the merchants landing page
class MerchantTrustBadges extends StatelessWidget {
  const MerchantTrustBadges({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _buildBadge(HugeIcons.strokeRoundedShield01, 'Verified'),
        const SizedBox(width: 12),
        _buildBadge(HugeIcons.strokeRoundedWallet01, 'Integrated'),
        const SizedBox(width: 12),
        _buildBadge(HugeIcons.strokeRoundedFlash, 'Instant'),
      ],
    );
  }

  Widget _buildBadge(IconData icon, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: HexColor('#E8E8E8')),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: HexColor(AppColors.primaryGreen),
              size: 22,
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: HexColor('#404040'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

