import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

import '../screens.dart';
class SmsSenderIds extends StatelessWidget {
  const SmsSenderIds({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('Sender IDs',style: Blacks.mediumSemiRubik),
      ),
      body: DefaultTabController(
          length: 2,
          child: Column(
            children: [
              TabBar(
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerHeight: 0,
                  padding: Paddings.tinyAllSides,
                  labelStyle: Greens.regularInter,
                  dividerColor: Colors.transparent,
                  indicatorColor: HexColor('#15411D'),
                  indicator: BoxDecoration(
                      border: Border.all(
                          color: HexColor('15411D'),
                          width: 2
                      ),
                      borderRadius: BorderRadius.circular(5)
                  ),
                  unselectedLabelColor: HexColor('#8E8E8E'),
                  unselectedLabelStyle: Grays.regularSemiInter,
                  tabs: [
                    Tab(text: "Active IDs"),
                    Tab(text: "Requested IDs")
                  ]),
              const Expanded(
                  child: TabBarView(
                      children: [
                        ActiveSenderIds(),
                        RequestedSenderIds()
                      ]))
            ],
          ))
    );
  }
}
