import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';

/// Header section for SMS TopUp page with icon and title
class SmsTopupHeader extends StatelessWidget {
  const SmsTopupHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Icon container with glow effect
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                HexColor(AppColors.primaryGreen),
                HexColor(AppColors.fadedGreen),
              ],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: HexColor(AppColors.primaryGreen).withAlpha(76),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(
            HugeIcons.strokeRoundedCoins01,
            color: Colors.white,
            size: 32,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Buy SMS Credits',
          style: Blacks.mediumSemiRubik.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Purchase credits to send bulk messages',
          style: Grays.tinyPoppinsHint,
        ),
      ],
    );
  }
}

