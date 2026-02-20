import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// What are Merchants card for the landing page
class MerchantWhatAreCard extends StatelessWidget {
  const MerchantWhatAreCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  color: HexColor(AppColors.primaryGreen),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'What are Merchants?',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: HexColor('#1A1A1A'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildStepItem(
            '1',
            'Browse & Install',
            'Explore our curated marketplace of verified merchant apps',
          ),
          const SizedBox(height: 14),
          _buildStepItem(
            '2',
            'Connect Seamlessly',
            'Merchants integrate directly with your Tuku wallet',
          ),
          const SizedBox(height: 14),
          _buildStepItem(
            '3',
            'Pay Instantly',
            'Make payments, donations, and purchases in one tap',
          ),
        ],
      ),
    );
  }

  Widget _buildStepItem(String number, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                HexColor(AppColors.primaryGreen),
                HexColor(AppColors.primaryGreen).withAlpha(180),
              ],
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: HexColor('#1A1A1A'),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
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
    );
  }
}

