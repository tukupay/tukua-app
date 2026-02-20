import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class Green extends StatelessWidget {
  const Green({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 1,
      width: size.width,
      decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                HexColor('036930'),
                HexColor('FFC52A').withAlpha(100),
                HexColor('FFC52A').withAlpha(10)
              ])
      ),
    );
  }
}
