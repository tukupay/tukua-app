import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class SmsNewButton extends StatelessWidget {
  final String text;
  final void Function() tapped;
  const SmsNewButton({super.key,
  required this.text,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: Container(
        padding: Paddings.smallestAllSides,
        color: HexColor(AppColors.lightestGray).withAlpha(100),
        child: Row(
          children: [
            Container(
              padding: Paddings.tinyAllSides,
              decoration: BoxDecoration(
                color: HexColor(AppColors.lightestGray),
                borderRadius: BorderRadius.circular(14)
              ),
              child: Icon(Icons.add,color: HexColor(AppColors.primaryOrange)),
            ),
            Spaces.smallSideSpace,
            Text(text,style: Blacks.regularCairo)
          ],
        ),
      ),
    );
  }
}
