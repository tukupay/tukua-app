import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../../routes.dart';

class NotificationsBell extends StatelessWidget {
  final bool? isLight;
  const NotificationsBell({super.key,
  this.isLight=false});

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
        builder: (_,notifications,__) {
          return GestureDetector(
            onTap: (){
              Navigator.pushNamed(context, Routes.notifications);
            },
            child: Stack(
              children: [
                Icon(Icons.notifications_none,
                    color: isLight==true?Colors.white: Colors.black,
                    size: 24),
                (notifications.notificationStats?.unreadCount??0)>0?
                Positioned(
                    top: 0,
                    child: Container(
                        alignment: Alignment.center,
                        height: 10,width: 10,
                        padding: Paddings.tinyAllSides,
                        decoration: BoxDecoration(
                            color: HexColor(AppColors.primaryGreen),
                            shape: BoxShape.circle
                        )
                    )):const SizedBox()
              ],
            ),
          );
        }
    );
  }
}
