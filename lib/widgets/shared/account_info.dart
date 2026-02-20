import 'package:flutter/material.dart';

import '../../constants/constants.dart';
class AccountInfo extends StatelessWidget {
  final String title;
  final String content;
  const AccountInfo({super.key,
  required this.title,
  required this.content});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(title,style: Grays.smallRoboto),
        Spaces.smallSideSpace,
        Text(content,
            style: Blacks.regularBoldCodeNext)
      ],
    );
  }
}
