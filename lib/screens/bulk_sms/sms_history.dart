import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
class SmsHistory extends StatefulWidget {
  const SmsHistory({super.key});

  @override
  State<SmsHistory> createState() => _SmsHistoryState();
}

class _SmsHistoryState extends State<SmsHistory> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<SmsProvider>(context,listen: false).getOutbox();
      await Provider.of<SmsProvider>(context,listen: false).getSmsStats();
      await Provider.of<CreditsProvider>(context,listen: false).getTransactionHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('SMS History',style: Blacks.mediumSemiRubik),
      ),
      body: DefaultTabController(
          length: 4,
          child: Column(
            children: [
              TabBar(
                isScrollable: true,
                  indicatorSize: TabBarIndicatorSize.tab,
                  padding: Paddings.tinyAllSides,
                  dividerHeight: 0,
                  labelStyle: Greens.regularInter,
                  dividerColor: Colors.transparent,
                  indicatorColor: HexColor('#15411D'),
                  tabAlignment: TabAlignment.center,
                  tabs: [
                    Tab(text: 'Outbox'),
                    Tab(text: 'Flagged Messages'),
                    Tab(text: 'Analytics'),
                    Tab(text: 'Costs'),
                  ]),
              Expanded(
                  child: TabBarView(
                      children: [
                        Outbox(),
                        FlaggedMessages(),
                        BulkSmsAnalytics(),
                        BulkSmsCosts()
                      ]))
            ],
          ))
    );
  }
}