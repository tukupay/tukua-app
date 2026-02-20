import 'package:flutter/material.dart';
import '../../../constants/constants.dart';
import '../../widget.dart';

class VideoQueue extends StatelessWidget {
  const VideoQueue({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      child: SingleChildScrollView(
        primary: true,
        padding: Paddings.smallAllSides,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Up next',style: Blacks.smallestBolderPoppins),
            Spaces.tinyTopSpace,
            ListView.builder(
                primary: false,
                itemCount: 6,
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemBuilder: (context,index){
                  return QueueCard();
                })
          ],
        ),
      ),
    );
  }
}
