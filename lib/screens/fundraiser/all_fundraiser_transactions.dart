import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';

class AllFundraiserTransactions extends StatelessWidget {
  const AllFundraiserTransactions({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text("Transactions",style: Blacks.mediumSemiRoboto),
        centerTitle: true,
      ),
      body: Consumer<FundraiserProvider>(
        builder: (_,fundraiserProvider,__) {
          return SizedBox(
            width: size.width,
            child: DefaultTabController(
                length: 2,
                child: Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(
                            color: HexColor(AppColors.lightestGray),
                          ),
                          borderRadius: BorderRadius.circular(4)
                      ),
                      child: TabBar(
                          dividerColor: Colors.transparent,
                          indicator: BoxDecoration(
                              border: Border.all(color: HexColor(AppColors.primaryGreen)),
                              borderRadius: BorderRadius.circular(4)
                          ),
                          labelColor: HexColor(AppColors.primaryGreen),
                          indicatorSize: TabBarIndicatorSize.tab,
                          indicatorPadding: Paddings.smallestAllSides,
                          tabs:  [
                            Tab(text: 'Pledges'),
                            Tab(text: 'Contributions')
                          ]),
                    ),
                    Expanded(
                        child: TabBarView(
                            children: [
                              IndividualFundraiserPledges(length: fundraiserProvider.campaignAnalytics?.recentPledges?.length??0),
                              IndividualFundraiserContributions(length: fundraiserProvider.campaignAnalytics?.recentContributions?.length??0)
                            ]))
                  ],
                )),
          );
        }
      )
    );
  }
}
