import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';

class SenderIdCard extends StatelessWidget {
  final ActualSenderId senderId;
  const SenderIdCard({super.key,
  required this.senderId});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      margin: Paddings.tinyVertical,
      width: size.width,
      padding: Paddings.tinyAllSides,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: HexColor(AppColors.lightGray),
          )
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(senderId.senderId,style: Blacks.mediumSemiRubik),
                Text(senderId.description??'No description..',style: Grays.smallestPoppinsHint,
                    overflow: TextOverflow.ellipsis)
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(senderId.status),
              Text(formatDate(senderId.createdAt),style: Grays.tinyPoppinsHint)
            ],
          )
        ],
      ),
    );
  }
}
