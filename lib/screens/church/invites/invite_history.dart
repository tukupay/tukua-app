import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
class InviteHistory extends StatelessWidget {
  const InviteHistory({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      alignment: Alignment.center,
      height: size.height,
      width: size.width,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(Strings.imageAsset("nohistory.png"),
          height: 155,width: 215,fit: BoxFit.contain),
          Spaces.smallTopSpace,
          Text("No New Friend Invited",style: Blacks.regularBoldCodeNext)
        ],
      ),
    );
  }
}
