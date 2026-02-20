import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/models/models.dart';

import '../../constants/constants.dart';
class SenderIdRequestCard extends StatelessWidget {
  final SenderIdResponse senderId;
  const SenderIdRequestCard({super.key,
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
                Wrap(
                  spacing: 8,
                    runSpacing: 4,
                    direction: Axis.horizontal,
                children: senderId.requestedSenderIds!.map((s)=>
                    Container(
                      padding: Paddings.smallestAllSides,
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.lightestGray),
                          borderRadius: BorderRadius.circular(14)
                        ),
                        child: Text(s))).toList()),
                Spaces.smallTopSpace,
                Text(senderId.reason??'No description..',style: Grays.smallestPoppinsHint,
                    overflow: TextOverflow.ellipsis)
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(senderId.status!),
              Text(formatDate(senderId.createdAt!),style: Grays.tinyPoppinsHint)
            ],
          )
        ],
      ),
    );
  }
}
