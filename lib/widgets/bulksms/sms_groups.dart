import 'package:flutter/material.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
class SmsGroups extends StatelessWidget {
  const SmsGroups({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text('Groups', style: Blacks.regularBoldCodeNext),
            GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, Routes.groupsMgt);
                },
                child: Text('View All', style: Greens.smallBoldInter))
          ],
        ),
        Spaces.smallTopSpace,
        Text("Groups allow you to send messages to multiple contacts at once. You can create new groups to organize your contacts.",
        style: Blacks.tinyRoboto),
        Spaces.smallTopSpace,
        SmsNewButton(
            text: 'Add New Group',
            tapped: (){
              Navigator.pushNamed(context, Routes.newGroup);
            })
      ],
    );
  }
}
