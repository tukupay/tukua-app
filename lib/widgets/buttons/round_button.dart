import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
class RoundButton extends StatelessWidget {
  final void Function() tapped;
  final IconData icon;
  const RoundButton({super.key,
  required this.tapped,
  required this.icon});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: tapped,
      child: Container(
        padding: Paddings.tinyAllSides,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: HexColor('#BEBAB9')
          )
        ),
        child: Icon(icon,
        color: HexColor(AppColors.fadedGreen)),
      ),
    );
  }
}
