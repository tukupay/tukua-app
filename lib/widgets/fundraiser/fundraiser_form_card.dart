import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

/// A styled form section card for fundraiser creation
class FundraiserFormCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  final Color? iconBgColor;
  final Color? iconColor;

  const FundraiserFormCard({
    super.key,
    required this.title,
    required this.icon,
    required this.child,
    this.iconBgColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(200),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HexColor(AppColors.lightGray).withAlpha(100)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 12,
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
                  color: iconBgColor ?? HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: iconColor ?? HexColor(AppColors.primaryGreen),
                ),
              ),
              const SizedBox(width: 12),
              Text(title, style: Blacks.tinyBolderPoppins),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

