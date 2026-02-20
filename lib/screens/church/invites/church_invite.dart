import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class ChurchInvite extends StatelessWidget {
  const ChurchInvite({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Stack(
          children: [
            DashBar(title: Text("Invite Member",style: Whites.mediumSemiRoboto)),
            Positioned(
                top: size.height/7,
                bottom: 0,
                child: Container(
                  height: size.height,
                  width: size.width,
                  decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(12),
                          topRight: Radius.circular(12)
                      )
                  ),
                  child: DefaultTabController(
                      length: 2,
                      child: Column(
                        children: [
                          TabBar(
                              padding:const EdgeInsets.only(top: 12,left: 8),
                              indicatorSize: TabBarIndicatorSize.tab,
                              dividerColor: HexColor('DFE2E4'),
                              indicatorWeight: 4,
                              dividerHeight: 4,
                              isScrollable: false,
                              labelStyle: Blacks.smallestBoldPoppins,
                              indicatorColor: HexColor('88470B'),
                              tabs: [
                                Tab(text: "Friend Details"),
                                Tab(text: "History")
                              ]),
                          const Expanded(
                              child: TabBarView(
                                  children: [
                                    NewInvite(),
                                    InviteHistory()
                                  ]))
                        ],
                      ))
                ))
          ]
        ),
      )
    );
  }
}
