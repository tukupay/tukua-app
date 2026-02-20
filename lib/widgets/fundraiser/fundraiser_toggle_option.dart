import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

/// A styled toggle/switch row for fundraiser options
class FundraiserToggleOption extends StatelessWidget {
  final String title;
  final String description;
  final bool value;
  final ValueChanged<bool> onChanged;
  final IconData? icon;

  const FundraiserToggleOption({
    super.key,
    required this.title,
    required this.description,
    required this.value,
    required this.onChanged,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: value
            ? HexColor(AppColors.primaryGreen).withAlpha(15)
            : HexColor('#F8FAF9'),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value
              ? HexColor(AppColors.primaryGreen).withAlpha(60)
              : HexColor('#E8ECE9'),
        ),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: value
                    ? HexColor(AppColors.primaryGreen).withAlpha(25)
                    : HexColor('#E8ECE9'),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                size: 16,
                color: value
                    ? HexColor(AppColors.primaryGreen)
                    : HexColor(AppColors.darkerGray2),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Blacks.tinyBolderPoppins.copyWith(fontSize: 13),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: Grays.tinyPoppinsHint.copyWith(fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          CupertinoSwitch(
            value: value,
            activeTrackColor: HexColor(AppColors.primaryGreen),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

