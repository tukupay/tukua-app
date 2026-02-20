import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';

class EmptyNotifications extends StatelessWidget {
  final String hint;
  const EmptyNotifications({super.key,
  required this.hint});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(HugeIcons.strokeRoundedNotificationBlock03,
            size: 42,
            color: HexColor(AppColors.lightGray)),
        Text(hint,style: Grays.regularBoldPoppins),
      ],
    );
  }
}
