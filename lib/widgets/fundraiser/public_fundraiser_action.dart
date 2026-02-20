import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';

class PublicFundraiserAction extends StatelessWidget {
  final IconData icon;
  final String title;
  final String color;
  final String subTitle;
  final IconData subIcon;
  final double amount;
  final void Function() tapped;
  const PublicFundraiserAction({
    super.key,
    required this.icon,
    required this.title,
    required this.color,
    required this.subTitle,
    required this.subIcon,
    required this.tapped,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    final actionColor = HexColor(color);

    return GestureDetector(
      onTap: tapped,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: actionColor.withAlpha(60), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: actionColor.withAlpha(20),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: actionColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 22, color: actionColor),
                ),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: actionColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(subIcon, size: 14, color: HexColor(AppColors.darkerGray2)),
                const SizedBox(width: 6),
                Text(
                  subTitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'KES ${formatThousands(amount: amount, noDecimal: true)}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
