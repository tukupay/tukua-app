import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../constants/constants.dart';
import '../../../routes.dart';

class EmptySheetBanks extends StatelessWidget {
  const EmptySheetBanks({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisSize: MainAxisSize.max,
      children: [
        Spaces.largeTopSpace,
        Icon(HugeIcons.strokeRoundedBank,size: 56,
            color: HexColor(AppColors.darkerGray)),
        Spaces.smallTopSpace,
        Text("",
            style: Grays.smallestPoppinsHint),
        RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
                text: "Seems you haven't linked any banks. ",
                style: Grays.regularSemiInter,
                children: [
                  TextSpan(
                      text: "Link One",
                      recognizer: TapGestureRecognizer()..onTap=(){
                        Navigator.pop(context);
                        Navigator.pushNamed(context, Routes.newBank);
                      },
                      style: Greens.regularSemiRoboto
                  )
                ]
            ))
      ],
    );
  }
}
