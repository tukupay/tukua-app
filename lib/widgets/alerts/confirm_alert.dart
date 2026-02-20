import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';
class ConfirmAlert extends StatelessWidget {
  final String text;
  final void Function() pressed;
  const ConfirmAlert({super.key,
  required this.text,
  required this.pressed});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return AlertDialog(
      elevation: 0,
      contentPadding: EdgeInsets.zero,
      backgroundColor: Colors.white,
      content: Container(
        height: 255,
        width: size.width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20)
        ),
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Image.asset(Strings.imageAsset('sure.png'),
            height: 120,width: 120,),
            Text(text,style: Blacks.regularBoldCodeNext,
            textAlign: TextAlign.center),
            Spaces.smallTopSpace,
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: (){
                    Navigator.pop(context);
                  },
                  child: Container(
                    padding: Paddings.smallAllSides,
                    decoration: BoxDecoration(
                      color: HexColor('#727673'),
                      borderRadius: BorderRadius.circular(12)
                    ),
                    child: Text('Cancel',style: TextStyle(color: Colors.white)),
                  ),
                ),
                Spaces.smallSideSpace,
                GestureDetector(
                  onTap:  pressed,
                  child: Container(
                    padding: Paddings.smallAllSides,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                          colors: [
                            HexColor(AppColors.primaryGreen),
                            HexColor(AppColors.fadedGreen)
                          ]),
                        borderRadius: BorderRadius.circular(12)
                    ),
                    child: Text('Confirm',style: TextStyle(color: Colors.white)),
                  ),
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
