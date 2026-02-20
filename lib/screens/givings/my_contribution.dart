import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class MyContribution extends StatelessWidget {
  const MyContribution({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<FundraiserProvider>(
        builder: (_,fundraiserProvider,__){
          return Scaffold(
              appBar: AppBar(
                centerTitle: true,
                title: Text("MY CONTRIBUTION",style: Blacks.regularSemiRoboto),
                actions: [
                  NotificationsBell(),
                  Spaces.tinySideSpace
                ],
              ),
          body: Container(
            padding: Paddings.tinyAllSides,
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('bg.png')),
                    fit: BoxFit.cover)
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                // selected contribution method
                SelectedContributionMethod(),
                // conditional body rendering
                if(fundraiserProvider.selectedContributionMethod?.method==tukuGivingMethod)
                  TukuContribution()
                else if(fundraiserProvider.selectedContributionMethod?.method==mpesaGivingMethod)
                  MpesaContribution()
                else if(fundraiserProvider.selectedContributionMethod?.method==cardGivingMethod)
                  CardContribution()
                else if(fundraiserProvider.selectedContributionMethod?.method==bankGivingMethod)
                  BankContribution()
              ],
            ),
          ),
          );
        });
  }
}
