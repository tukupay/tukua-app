import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class AuthButton extends StatelessWidget {
  final String text;
  final void Function() tapped;
  final String? color;
  final bool enabled;
  const AuthButton({super.key,
  required this.text,
  required this.tapped,
    this.enabled=true,
  this.color});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: Container(
        alignment: Alignment.center,
        height: 47,width: size.width/1.2,
        decoration: BoxDecoration(
          color: enabled==false?Colors.grey: HexColor(color?? AppColors.primaryGreen),
          borderRadius: BorderRadius.circular(30)
        ),
        child: Text(text,
            style: Whites.regularSemiRoboto),
      ),
    );
  }
}
