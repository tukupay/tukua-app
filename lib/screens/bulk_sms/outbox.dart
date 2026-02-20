import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class Outbox extends StatelessWidget {
  const Outbox({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<SmsProvider>(
      builder: (_,smsProvider,__) {
        return smsProvider.loadingOutbox?
              // loading shimmer
          ListView.separated(
              separatorBuilder: (context,index)=>Container(
                width: size.width,
                height: 0.5,
                color: HexColor(AppColors.lightGray),
              ),
              itemCount: 10,
              shrinkWrap: true,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context,index){
                return OutboxSmsCardShimmer();
              }) :
              smsProvider.outbox.isEmpty?
                  // empty outbox
          Container(
          padding: Paddings.smallAllSides,
          child: emptyOutbox(context),
        ):
        ListView.separated(
          separatorBuilder: (context,index)=>Container(
            width: size.width,
            height: 0.5,
            color: HexColor(AppColors.lightGray),
          ),
            itemCount: smsProvider.outbox.length,
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            itemBuilder: (context,index){
              OutboxSms sms=smsProvider.outbox[index];
              return OutboxSmsCard(sms: sms);
            })
        ;
      }
    );
  }
}

Widget emptyOutbox(BuildContext context){
  final size=MediaQuery.of(context).size;
  return SizedBox(
    width: size.width,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(HugeIcons.strokeRoundedMessageDone01,size: 45,
        color: HexColor(AppColors.lightGray)),
        Spaces.smallTopSpace,
        Text("Messages you send will appear here",style: Grays.smallRoboto)
      ],
    ),
  );
}
