import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../../constants/constants.dart';
import '../../../routes.dart';
class SkipButton extends StatelessWidget {
  const SkipButton({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap:(){
        Navigator.pushNamed(context, Routes.home);
      },
      child: Container(
        padding: Paddings.tinyAllSides,
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
                color: HexColor(AppColors.fadedGreen).withAlpha(80)
            )
        ),
        child: Text('Do This Later',
          style: Grays.smallRoboto,
        ),
      ),
    );
  }
}
