import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class HorizontalYellowGreen extends StatelessWidget {
  const HorizontalYellowGreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 75,height: 1,
      decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.centerRight,
              end: Alignment.centerLeft,
              colors: [
                HexColor('036930'),
                HexColor('FFC52A').withAlpha(30)
              ])
      ),
    );
  }
}
