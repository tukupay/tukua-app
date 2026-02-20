import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';
import '../../routes.dart';
class AddButton extends StatelessWidget {
  final void Function() tapped;
  final String text;
  final String? color;
  const AddButton({super.key,
  required this.tapped,
  required this.text,
  this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap:tapped,
      child: Container(
        padding: Paddings.tinyAllSides,
        decoration: BoxDecoration(
          border: Border.all(
            color: HexColor(AppColors.primaryGreen),
          ),
          color: color!=null?HexColor(color!):Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          children: [
            Icon(HugeIcons.strokeRoundedAdd01,
                color: color!=null?Colors.white: HexColor(AppColors.primaryGreen),
            size: 18),
            Spaces.tinySideSpace,
            Text(text,
                style: color!=null?Whites.smallBoldRoboto: Greens.smallBoldInter)
          ],
        ),
      ),
    );
  }
}
