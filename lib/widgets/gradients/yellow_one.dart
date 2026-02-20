import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class YellowOne extends StatelessWidget {
  const YellowOne({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 0.5,width: 76,
      decoration: BoxDecoration(
        gradient: LinearGradient(
            begin: Alignment.centerRight,
            end: Alignment.centerLeft,
            colors: [
              HexColor('F79515'),
              HexColor('FFC52A').withAlpha(30)
            ])
      ),
    );
  }
}
