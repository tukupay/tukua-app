import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class Bullet extends StatelessWidget {
  final String text;
  final IconData icon;
  const Bullet({super.key, required this.text, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: HexColor(AppColors.fadedGreen)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: Grays.smallestBolderPoppinsHint))
        ],
      ),
    );
  }
}

