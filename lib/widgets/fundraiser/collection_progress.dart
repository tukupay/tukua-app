import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';

class CollectionProgress extends StatelessWidget {
  final int collected;
  final int target;
  const CollectionProgress({
    super.key,
    required this.collected,
    required this.target,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final progress = (collected / target * 100).clamp(0, 100);

    return Container(
      width: size.width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: HexColor(AppColors.lightestGray).withAlpha(80),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HexColor(AppColors.lightestGray)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Progress bar
          Container(
            height: 10,
            width: double.infinity,
            decoration: BoxDecoration(
              color: HexColor(AppColors.lightestGray),
              borderRadius: BorderRadius.circular(5),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (progress / 100).clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      HexColor(AppColors.primaryGreen),
                      HexColor(AppColors.brightGreen),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(5),
                  boxShadow: [
                    BoxShadow(
                      color: HexColor(AppColors.primaryGreen).withAlpha(60),
                      blurRadius: 8,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          // Stats row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                icon: HugeIcons.strokeRoundedInboxDownload,
                iconColor: HexColor(AppColors.primaryGreen),
                label: 'Collected',
                value: formatThousands(amount: collected.toDouble(), noDecimal: true),
              ),
              _buildStatItem(
                icon: HugeIcons.strokeRoundedTarget02,
                iconColor: HexColor(AppColors.brightGreen),
                label: 'Target',
                value: formatThousands(amount: target.toDouble(), noDecimal: true),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withAlpha(20),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 16),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
            Text(
              'KES $value',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
