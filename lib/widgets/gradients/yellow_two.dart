import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class YellowTwo extends StatelessWidget {
  const YellowTwo({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 0.5,width: 76,
      decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.centerRight,
              end: Alignment.centerLeft,
              colors: [
                HexColor('FFC52A').withAlpha(30),
                HexColor('F79515'),
              ])
      ),
    );
  }
}
