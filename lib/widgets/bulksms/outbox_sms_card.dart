import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/models/models.dart';

import '../../constants/constants.dart';
class OutboxSmsCard extends StatelessWidget {
  final OutboxSms sms;
  const OutboxSmsCard({super.key,
  required this.sms});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.smallAllSides,
      width: size.width,
      margin: Paddings.smallestVertical,
      decoration: BoxDecoration(
          color: Colors.white
      ),
      child: Row(
        children: [
          Container(
            height: 45,
            width: 45,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: HexColor(
                  sms.status=='success'? AppColors.primaryGreen:
                  sms.status=='failed'?AppColors.red:
                  AppColors.primaryOrange),
            ),
            child: Icon(
              sms.status=='success'?
              HugeIcons.strokeRoundedMessageDone01:
              sms.status=='failed'?
              HugeIcons.strokeRoundedMessageCancel01:
              HugeIcons.strokeRoundedMessage01,
              size: 24,color: Colors.white,weight: 4,),
          ),
          Spaces.smallSideSpace,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sms.phoneNumber!,style: Blacks.smallestBolderPoppins),
                Text(sms.message!,style: Grays.tinyPoppinsHint,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Spaces.smallSideSpace,
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatDate(sms.createdAt!),style: Grays.smallestPoppinsHint),
              Text(formatTime(sms.createdAt!),style: Grays.smallestPoppinsHint,)
            ],
          )
        ],
      ),
    );
  }
}
