import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Benefits card for the merchants landing page
class MerchantBenefitsCard extends StatelessWidget {
  const MerchantBenefitsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor('#F0FDF4'),
            HexColor('#ECFDF5'),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Why use Merchant Apps?',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: HexColor('#1A1A1A'),
            ),
          ),
          const SizedBox(height: 16),
          _buildBenefitRow(HugeIcons.strokeRoundedChurch, 'Church tithes & offerings'),
          const SizedBox(height: 12),
          _buildBenefitRow(HugeIcons.strokeRoundedShoppingBag01, 'Shop from local businesses'),
          const SizedBox(height: 12),
          _buildBenefitRow(HugeIcons.strokeRoundedMortarboard01, 'Pay school fees'),
          const SizedBox(height: 12),
          _buildBenefitRow(HugeIcons.strokeRoundedHealtcare, 'Health services & appointments'),
          const SizedBox(height: 12),
          _buildBenefitRow(HugeIcons.strokeRoundedGift, 'Fundraisers & community support'),
        ],
      ),
    );
  }

  Widget _buildBenefitRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          color: HexColor(AppColors.primaryGreen),
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: HexColor('#404040'),
            ),
          ),
        ),
        Icon(
          HugeIcons.strokeRoundedCheckmarkCircle02,
          color: HexColor(AppColors.primaryGreen),
          size: 18,
        ),
      ],
    );
  }
}

