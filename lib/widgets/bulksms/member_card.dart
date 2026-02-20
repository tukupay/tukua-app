import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
class MemberCard extends StatelessWidget {
  final Contact contact;
  final int index;
  const MemberCard({super.key,
  required this.contact,
  required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: Paddings.tinyVertical,
      child: Row(
        children: [
          Text('${index+1}.',style: Blacks.regularBoldCodeNext),
          Spaces.smallSideSpace,
          Container(
            height: 45,width: 45,
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HexColor(AppColors.primaryOrange)
            ),
            alignment: Alignment.center,
            child: Text(createInitials(contact.name)),
          ),
          Spaces.smallSideSpace,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(contact.name,style: Blacks.regularSemiRoboto),
                Text(contact.phone!,style: Grays.tinyPoppinsHint),
                // Text(contact.description,style: Blacks.smallestBoldPoppins,
                //     overflow: TextOverflow.ellipsis)
              ],
            ),
          ),
          Spaces.smallSideSpace,
        ],
      ),
    );
  }
}
