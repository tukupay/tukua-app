import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';

class SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const SectionHeader({super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(20),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: HexColor(AppColors.primaryGreen)),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Blacks.smallestBoldPoppins),
            Text(subtitle, style: Grays.tinyPoppinsHint),
          ],
        ),
      ],
    );
  }
}
