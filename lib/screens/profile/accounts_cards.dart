import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class AccountsCards extends StatelessWidget {
  const AccountsCards({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back,
                color: HexColor('#404040'))),
        title: Text('Accounts', style: Blacks.mediumSemiRoboto),
        centerTitle: true,
        actions: [
          NotificationsBell(),
          Spaces.smallSideSpace
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
            color: Colors.white.withAlpha(150),
          ),
          child: DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  Padding(
                      padding: Paddings.smallHorizontal,
                  child: TabBar(
                      labelStyle: Blacks.regularSemiRoboto,
                      indicatorColor: HexColor('EE7D13'),
                      isScrollable: false,
                      indicatorSize: TabBarIndicatorSize.tab,
                      indicatorWeight: 4,
                      dividerHeight: 4,
                      dividerColor: HexColor('DFE2E4'),
                      tabs: const[
                        Tab(text: 'My Bank Accounts'),
                        Tab(text: 'My Wallets'),
                        // Tab(text: 'My Cards')
                      ])),
                  const Expanded(
                      child: TabBarView(
                          children: [
                            MyBankAccounts(),
                            MyWallets(),
                            // MyCards(),
                          ]))
                ],
              )),
        ),
      )
    );
  }
}
