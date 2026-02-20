import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Hero section for the merchants landing page
class MerchantLandingHero extends StatelessWidget {
  const MerchantLandingHero({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor(AppColors.primaryGreen).withAlpha(25),
            HexColor(AppColors.primaryGreen).withAlpha(8),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(40),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      HexColor(AppColors.primaryGreen),
                      HexColor(AppColors.primaryGreen).withAlpha(200),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: HexColor(AppColors.primaryGreen).withAlpha(60),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  HugeIcons.strokeRoundedStore02,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mini Apps Marketplace',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: HexColor('#1A1A1A'),
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Your gateway to specialized services',
                      style: TextStyle(
                        fontSize: 13,
                        color: HexColor('#666666'),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Description
          Text(
            'Access churches, businesses, health services, education platforms and more - all integrated with your Tuku wallet for seamless payments.',
            style: TextStyle(
              fontSize: 14,
              color: HexColor('#404040'),
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}

