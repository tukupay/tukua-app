import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';

import '../../routes.dart';
class LipaNaMpesa extends StatelessWidget {
  const LipaNaMpesa({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Consumer<MpesaProvider>(
          builder: (_,mpesa,__) {
            return Text('Lipa Na Mpesa',
                style: Blacks.regularBoldCodeNext);
          }
        ),
        actions: [
          GestureDetector(
              onTap: (){
                Navigator.pushNamed(context, Routes.notifications);
              },
              child: NotificationsBell()),
          Spaces.smallSideSpace
        ],
      ),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('bg.png')))
        ),
        child: DefaultTabController(
            length: 3,
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(
                        color: Colors.black38,
                      ),
                      borderRadius: BorderRadius.circular(18)
                    ),
                    child: TabBar(
                      dividerColor: Colors.transparent,
                      indicator: BoxDecoration(
                        color: HexColor(AppColors.fadedGreen),
                        borderRadius: BorderRadius.circular(14)
                      ),
                        labelColor: Colors.white,
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicatorPadding: Paddings.smallestAllSides,
                        tabs:  [
                          Tab(text: Strings.buyGoods),
                          Tab(text: Strings.paybill),
                          Tab(text: Strings.bills)
                        ]),
                  ),
                  Expanded(
                      child: TabBarView(
                          children: [
                            BuyGoods(),
                            Paybill(),
                            BillsLanding()
                          ]))
                ],
              ),
            ))
      )
    );
  }
}
