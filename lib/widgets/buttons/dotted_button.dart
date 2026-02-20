import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class DottedButton extends StatelessWidget {
  final void Function() tapped;
  final String text;
  const DottedButton({super.key,
    required this.tapped,
  required this.text});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: DottedBorder(
        padding: EdgeInsets.zero,
        color: Colors.black,
        strokeWidth: 8,
        dashPattern: const [20,20],
        borderType: BorderType.Rect,
        strokeCap: StrokeCap.square,
        child: Container(
          alignment: Alignment.center,
          height: 50,
          width: size.width,
          decoration: BoxDecoration(
            color: HexColor('#15411D'),
            borderRadius: BorderRadius.circular(5)
          ),
          child: Text(text,style: Whites.regularRoboto),
        ),
      ),
    );
  }
}
