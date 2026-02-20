import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';
import '../../widgets/widget.dart';
class LogoPartners extends StatelessWidget {
  const LogoPartners({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      //color: Colors.blueAccent.withAlpha(100),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: Paddings.smallVertical,
            width: size.width/1.2,
            decoration: BoxDecoration(
              color: HexColor('F7F7F7'),
              border: Border.all(color: HexColor('E8E8E8')),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withAlpha(40),
                    blurRadius: 16.5,
                    spreadRadius: -8,
                    offset: Offset(0, 15))
              ]
            ),
              child: Column(
                children: [
                  ColorChangingText(text: 'Tuku'),
                  HorizontalYellowGreen(),
                  Spaces.smallTopSpace,
                  Image.asset(Strings.imageAsset('coopwallet.png'),
                  fit: BoxFit.contain)
                ],
              )),
          Spaces.smallTopSpace,
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Powered By',style: Greens.tinyInter),
              Spaces.tinySideSpace,
              VerticalYellow(),
              Spaces.tinySideSpace,
              Image.asset(Strings.iconImage('tukupay.png'),
                  height: 15,width: 44,
                  fit: BoxFit.contain),
              Spaces.tinySideSpace,
              VerticalYellow(),
              Container(
                height: 15,width: 44,
                decoration: BoxDecoration(
                    image: DecorationImage(
                        image: AssetImage(Strings.iconImage('coop.png')),
                        fit: BoxFit.contain)
                ),
              ),
            ],
          ),
          Spaces.smallTopSpace,
        ],
      ),
    );
  }
}
