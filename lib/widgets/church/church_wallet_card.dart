import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
class ChurchWalletCard extends StatelessWidget {
  final String header;
  final String subTitle;
  final void Function() tapped;
  final String color;
  final IconData icon;
  final String text;
  final bool? hasArrow;
  const ChurchWalletCard({super.key,
  required this.header,
  required this.subTitle,
  required this.tapped,
  required this.color,
    required this.icon,
    required this.text,
    this.hasArrow=false
  });

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
        width: size.width,
        padding: Paddings.tinyAllSides,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: HexColor('#E5DDDD').withAlpha(10),
          border: Border.all(
            color: Colors.white
          ),
          boxShadow: [
            BoxShadow(
              offset: Offset(0, 1),
              blurRadius: 4,
              spreadRadius: 0,
              color: Colors.black.withAlpha(50),
                blurStyle: BlurStyle.outer
            )
          ]
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: Paddings.tinyAllSides,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle
              ),
              child: Icon(HugeIcons.strokeRoundedWallet01,
              color: HexColor(AppColors.primaryGreen)),
            ),
            Spaces.smallSideSpace,
            Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(header,
                    style: Blacks.regularBoldGrotesk),
                    Text(subTitle,style: Grays.smallRoboto)
                  ],
                )),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                GestureDetector(
                  onTap: tapped,
                  child: Container(
                    alignment: Alignment.center,
                    padding: Paddings.smallestAllSides,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: HexColor(color)
                      )
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(icon,color: HexColor(color),
                        size: 21),
                        Spaces.tinySideSpace,
                        Text(text,style: TextStyle(color: HexColor(color),
                            fontSize: 14,fontWeight: FontWeight.w800))
                      ],
                    ),
                  ),
                ),
                Spaces.tinyTopSpace,
                hasArrow==true?
                Icon(Icons.arrow_right_alt,
                    color: HexColor(color),weight: 8):
                    const SizedBox()
              ],
            )
          ],
        ));
  }
}
