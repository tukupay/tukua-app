import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
import '../../routes.dart';
class DashBar extends StatelessWidget {
  final Widget title;
  final bool? needsPop;
  final bool columnTitle;
  final bool? isNotifications;
  const DashBar({super.key,
    required this.title,
    this.needsPop=true,
    this.columnTitle=false,
    this.isNotifications=false});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.smallHorizontal,
      width: size.width,
      height: size.height/3.5,
      decoration: BoxDecoration(
        image: DecorationImage(
            image: AssetImage(Strings.imageAsset('kingsley.png')),
            fit: BoxFit.cover),
      ),
      child: Padding(
        padding: EdgeInsets.only(
            top: MediaQuery.of(context).viewPadding.top),
        child: Container(
          padding: Paddings.smallVertical,
          height: 40,
          alignment: Alignment.topCenter,
          child: Row(
            crossAxisAlignment:columnTitle?
            CrossAxisAlignment.start
                :CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              needsPop==true?
              IconButton(
                  onPressed: (){
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.arrow_back,color: Colors.white)):
              const SizedBox(),
              title,
              GestureDetector(
                onTap: (){
                  Navigator.pushNamed(context, Routes.notifications);
                },
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    isNotifications==true
                        ?const SizedBox():
                    Stack(
                      children: [
                        const Icon(HugeIcons.strokeRoundedNotification01,
                            color: Colors.white),
                        Positioned(
                            top: 0,
                            right: 0,
                            child: Container(
                              height: 5,width: 5,
                              decoration:const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.red
                              ),
                            ))
                      ],
                    ),
                    Spaces.smallSideSpace,
                    GestureDetector(
                      onTap: (){
                        Navigator.pushNamed(context, Routes.profile);
                      },
                      child: CircleAvatar(
                        radius: 16,
                        backgroundImage: AssetImage(Strings.imageAsset('prayer.png')),
                      ),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
