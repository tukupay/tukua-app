import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class OrangeYellow extends StatelessWidget {
  const OrangeYellow({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 1,width: size.width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              HexColor('#F79515'),
              HexColor('#FFC52A4F').withAlpha(60)
            ])
      ),
    );
  }
}
