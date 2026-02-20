import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../../constants/constants.dart';

class GradientAppBar extends StatelessWidget {
  const GradientAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
        decoration: BoxDecoration(
            gradient: LinearGradient(
      colors: [
        HexColor(AppColors.primaryGreen),
        HexColor(AppColors.fadedGreen),
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    )));
  }
}
