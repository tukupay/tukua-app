import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

import '../../models/models.dart';
import '../../widgets/widget.dart';
class ReadNotifications extends StatelessWidget {
  const ReadNotifications({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    List read=dummyNotifications.where((notification)=>notification.read==true).toList();
    return Scaffold(
        body: SizedBox(
          height: size.height,
          width: size.width,
          child: ListView.separated(
              separatorBuilder: (context,index)=>
                  Container(
                    width: size.width,height: 1,
                    color: HexColor('#E4E8EE'),
                  ),
              itemCount: read.length,
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              itemBuilder: (context,index){
                NotificationModel notification=read[index];
                return NotificationCard(notification: notification);
              }),
        )
    );
  }
}
