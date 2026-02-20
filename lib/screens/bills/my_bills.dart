import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
class MyBills extends StatelessWidget {
  const MyBills({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: (){
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back,
                color: HexColor('#404040'))),
        title: Text('My Bills',
            style: Blacks.mediumSemiRoboto),
        centerTitle: true,
        actions: [
          IconButton(
              onPressed: (){
                Navigator.pushNamed(context, Routes.notifications);
              },
              icon: const Icon(Icons.notifications,color: Colors.black))
        ],
      ),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('bg.png')),
          fit: BoxFit.cover)
        ),
        child: Container(
          height: size.height,
          width: size.width,
          decoration: BoxDecoration(
            image: DecorationImage(
                image: AssetImage(Strings.imageAsset('gradient1.png')),
            fit: BoxFit.cover)
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: Paddings.tinyAllSides,
                height: 50,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(HugeIcons.strokeRoundedCoins01,color: Colors.black,
                        size: 20),
                        Spaces.tinySideSpace,
                        Text('Bill Reminder',
                            style: Blacks.regularSemiRoboto)
                      ],
                    ),
                    GestureDetector(
                      onTap: (){
                        Navigator.pushNamed(context, Routes.addBill);
                      },
                      child: Icon(Icons.add_box_rounded,color: HexColor('#EE7D13')),
                    )
                  ],
                ),
              ),
              Expanded(
                child: DefaultTabController(
                    length: 4,
                    child: Column(
                      children: [
                        TabBar(
                          padding: Paddings.tinyHorizontal,
                          dividerColor: Colors.transparent,
                          indicatorColor: HexColor('#D0FFE8'),
                            indicatorPadding: Paddings.smallestAllSides,
                            labelStyle: Blacks.regularSemiRoboto,
                            isScrollable: true,
                            tabAlignment: TabAlignment.center,
                            indicatorSize: TabBarIndicatorSize.tab,
                            indicator: BoxDecoration(
                              color: HexColor('#D0FFE8'),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            tabs: const[
                              Tab(text: 'All'),
                              Tab(text: 'Upcoming'),
                              Tab(text: 'Overdue'),
                              Tab(text: 'Paid')
                            ]),
                        const Expanded(
                            child: TabBarView(
                                children: [
                                  AllBills(),
                                  UpcomingBills(),
                                  OverdueBills(),
                                  PaidBills()
                                ]))
                      ],
                    )),
              ),
            ],
          ),
        ),
      )
    );
  }
}
