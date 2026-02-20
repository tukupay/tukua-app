import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
class NotificationDetails extends StatelessWidget {
  const NotificationDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<NotificationProvider>(context,listen: false).resetNotification();
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
              onPressed: (){
                Navigator.pop(context);
              },
              icon: Icon(Icons.arrow_back,
                  color: HexColor('#404040'))),
          title: Text('Details',
              style: Blacks.mediumSemiRoboto),
          centerTitle: true,
        ),
        body: SizedBox(
          height: size.height,
          width: size.width,
          child: Stack(
            children: [
              Positioned(
                  top: -100,
                  right: -80,
                  child: Container(
                    height: 236,
                    width: 236,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: HexColor('054858').withOpacity(.15),
                    ),
                  )),
              Positioned(
                  left: -200,
                  right: -200,
                  top: -150,
                  child: Container(
                    height: 600,
                    width: 650,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: HexColor('4E8396')
                          .withOpacity(.10),
                    ),
                  )),
              Consumer<NotificationProvider>(
                builder: (_,notifications,__) {
                  return
                    notifications.selectedNotification==null?const SizedBox():
                    Container(
                      padding: Paddings.smallAllSides,
                      child: Column(
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                children: [
                                  Text(notifications.selectedNotification!.category??'Category',
                                  style: Blacks.regularSemiOutfit),
                                  Spaces.smallTopSpace,
                                  Container(
                                    height: 2,width: 150,
                                    color: HexColor('#104A51'),
                                  )
                                ],
                              ),
                              GestureDetector(
                                onTap: (){
                                  Navigator.pushNamed(context, Routes.notificationSettings);
                                },
                                child: Container(
                                  alignment: Alignment.center,
                                  height: 31,width: 31,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: HexColor('#F8A435')
                                  ),
                                  child: Icon(Icons.settings,color: Colors.white,
                                  size: 18),
                                ),
                              )
                            ],
                          ),
                          Spaces.smallTopSpace,
                          SizedBox(
                            width: size.width,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      height: 40,width: 40,
                                      decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(4),
                                          color: HexColor(AppColors.primaryGreen)
                                      ),
                                      child: Icon(HugeIcons.strokeRoundedNotification03,
                                          color: Colors.white,
                                          size: 20),
                                    ),
                                    Spaces.smallSideSpace,
                                    Text('Subject: ${notifications.selectedNotification?.type}',
                                    style: Blacks.tinyBolderPoppins),
                                  ],
                                ),
                                Spaces.smallTopSpace,
                                Center(
                                  child: SizedBox(
                                    width: size.width/1.3,
                                    child: Text(notifications.selectedNotification!.message??'Message',
                                    style: Grays.regularLightSemiPoppins),
                                  ),
                                )
                              ],
                            ),
                          )
                        ],
                      ),
                    );
                }
              ),
            ],
          ),
        ),
      ),
    );
  }
}
