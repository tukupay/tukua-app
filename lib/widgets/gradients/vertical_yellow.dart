import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class VerticalYellow extends StatelessWidget {
  final double? height;
  const VerticalYellow({super.key,
  this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 2,height: height?? 16,
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

