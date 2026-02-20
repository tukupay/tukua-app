import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class AltGreenButton extends StatelessWidget {
  final void Function()? tapped;
  final String text;
  final IconData? icon;
  final String? color;
  final bool disabled;
  const AltGreenButton({super.key,
    required this.tapped,
  required this.text,
  this.icon,
  this.color,
  this.disabled=false});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    final effectiveTap = disabled ? null : tapped;
    return GestureDetector(
      onTap: effectiveTap,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 160),
        opacity: disabled?0.55:1.0,
        child: Container(
          alignment: Alignment.center,
          height: 50,
          width: size.width/1.2,
          decoration: BoxDecoration(
            color: color!=null?HexColor(color!): (disabled?HexColor(AppColors.primaryGreen).withOpacity(0.6):null),
            gradient: color==null? LinearGradient(
                colors: [
                  HexColor(AppColors.primaryGreen),
                  HexColor(AppColors.fadedGreen)
                ]):null,
            borderRadius: BorderRadius.circular(12)
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(text,style: Whites.regularSemiRoboto,),
              Spaces.tinySideSpace,
              icon!=null?Icon(icon,
              color: Colors.white):const SizedBox()
            ],
          ),
        ),
      ),
    );
  }
}
