import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class Pill extends StatelessWidget {
  final String text;
  const Pill(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: HexColor(AppColors.fadedGreen).withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: HexColor(AppColors.lightGray)),
      ),
      child: Text(text, style: Grays.smallestBolderPoppinsHint),
    );
  }
}

