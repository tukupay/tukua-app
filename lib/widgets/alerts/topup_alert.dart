import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import '../../constants/constants.dart';
import '../widget.dart';

class TopUpAlert extends StatelessWidget {
  final String title;
  final String? type;
  final String? amount;
  final void Function() tapped;
  const TopUpAlert({super.key,
  required this.tapped,
  required this.title,
     this.type,
   this.amount});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return AlertDialog(
      contentPadding: EdgeInsets.zero,
      elevation: 0,
      backgroundColor: Colors.white,
      content: Container(
        height: 250,
        width: size.width/1.5,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.center,
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Success!',style: Oranges.smallSemiPoppins),
              Padding(
                padding: Paddings.tinyHorizontal,
                child: Text(title,style: Blacks.regularCairo),
              ),
              // AMOUNT TOPPED UP
              type!=null&&amount!=null?
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(type!,style: Blacks.regularSemiCairo),
                  Spaces.tinySideSpace,
                  Text(amount!,style: Greens.regularSemiRoboto)
                ],
              ):const SizedBox(),
              Spaces.smallTopSpace,
              // check mark
              Container(
                decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withAlpha(25),
                          spreadRadius: 0,
                          offset: Offset(0, 6),
                          blurRadius: 16
                      )
                    ]
                ),
                padding: Paddings.smallAllSides,
                child: Icon(Icons.check_circle,
                    color: HexColor(AppColors.primaryGreen)),
              ),
              Spaces.smallTopSpace,
              // home button
              SizedBox(
                width: size.width/4,
                child: AltGreenButton(
                    tapped: tapped,
                    text: 'Home'),
              )
            ]
        ),
      ),
    );
  }
}
