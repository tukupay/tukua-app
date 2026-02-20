import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
class NotificationCard extends StatelessWidget {
  final NotificationModel notification;
  const NotificationCard({super.key,
  required this.notification});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Provider.of<NotificationProvider>(context,listen: false).selectNotification(notification);
        Navigator.pushNamed(context, Routes.notificationDetails);
      },
      child: Container(
        alignment: Alignment.center,
        padding: Paddings.smallAllSides,
        height: 95,width: size.width,
        decoration: BoxDecoration(
          color: Colors.white
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              //color: Colors.redAccent,
              height: 50,width: 40,
              alignment: Alignment.center,
              child: Stack(
                children: [
                  Positioned(
                    bottom:0,
                    child: Container(
                      height: 40,width: 40,
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen),
                        borderRadius: BorderRadius.circular(6)
                      ),
                      child: Icon(HugeIcons.strokeRoundedNotification03,
                          size: 24,
                          color: Colors.white),
                    ),
                  ),
                  Positioned(
                      top: 0,left: 2,
                      child: Container(
                        height: 8,width: 8,
                        decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: notification.status=='read'?
                                Colors.transparent:
                            HexColor(AppColors.primaryGreen)
                        ),
                      ))
                ],
              ),
            ),
            Spaces.smallSideSpace,
            Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(notification.title??'Title',style: Blacks.regularSemiRoboto,
                    overflow: TextOverflow.ellipsis),
                    Spaces.tinyTopSpace,
                    Text('${formatDate(notification.createdAt??DateTime.now(),shorter: true)} at ${formatTime(notification.createdAt??DateTime.now())}',
                    style: Grays.tinyPoppinsHint,
                    overflow: TextOverflow.ellipsis)
                  ],
                )),
            Spaces.smallSideSpace,
            Container(
              width: 70,height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: HexColor('#DDDEE1')
                )
              ),
              child: Text('View',style: Grays.regularDarkerSemiInter),
            )
          ],
        ),
      ),
    );
  }
}
