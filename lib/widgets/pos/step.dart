import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class StepWidget extends StatelessWidget {
  final IconData icon;
  final String label;
  const StepWidget({super.key, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: HexColor(AppColors.lightGray)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 17, color: HexColor(AppColors.fadedGreen)),
          const SizedBox(width: 8),
          Text(label, style: Grays.smallestBolderPoppinsHint),
        ],
      ),
    );
  }
}

