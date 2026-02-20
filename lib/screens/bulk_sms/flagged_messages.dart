import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';

class FlaggedMessages extends StatelessWidget {
  const FlaggedMessages({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Spaces.mediumTopSpace,
          Icon(HugeIcons.strokeRoundedMessageCancel01,size: 45,
              color: HexColor(AppColors.lightGray)),
          Spaces.smallTopSpace,
          Text("Flagged messages will appear here",style: Grays.smallRoboto)
        ],
      ),
    );
  }
}
