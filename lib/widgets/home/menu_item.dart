import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
class MenuItem extends StatelessWidget {
  final String menu;
  final dynamic bgColor; // accepts Color or hex String for backward compatibility
  final void Function() tapped;
  final IconData? icon;
  final dynamic iconColor; // accepts Color or hex String
  final String? iconText;
  const MenuItem({super.key,
  required this.menu,
  required this.tapped,
  this.bgColor='#FFFFFF',
  this.icon,
    this.iconColor='#FFFFFF',
  this.iconText});

  @override
  Widget build(BuildContext context) {
    // resolve bgColor and iconColor to Color so callers can pass either a Color or a hex String
    final Color resolvedBg = bgColor is Color ? bgColor as Color : HexColor(bgColor?.toString() ?? '#FFFFFF');
    final Color resolvedIconColor = iconColor is Color ? iconColor as Color : HexColor(iconColor?.toString() ?? '#FFFFFF');

    return GestureDetector(
      onTap: tapped,
      child: Container(
        height: 80,
        // width: 76,
        alignment: Alignment.center,
        decoration:const BoxDecoration(
            color: Colors.transparent
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Container(
              alignment: Alignment.center,
              height:47,
              width: 47,
              decoration: BoxDecoration(
                border: Border.all(
                  color: HexColor('#EDF1FD')
                ),
                shape: BoxShape.circle,
                color: resolvedBg,),
              child: icon!=null? HugeIcon(
                  size: 33,
                  icon: icon!,
                  color: resolvedIconColor):
              iconText!=null?
              Text(iconText!,style:
              TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                fontFamily: GoogleFonts.spaceGrotesk().fontFamily
              )):
              const SizedBox(),
            ),
            Text(menu,style: TextStyle(
              fontFamily: GoogleFonts.inter().fontFamily,
              fontSize: 10,
              fontWeight: FontWeight.w700
            ),
              textAlign: TextAlign.center,
              maxLines: 1,
            )
          ],
        ),
      ),
    );
  }
}
