import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
class FulfillPledge extends StatelessWidget {
  const FulfillPledge({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<FundraiserProvider>(
        builder: (_,fundraiserProvider,__){
          return PopScope(
            canPop: true,
              onPopInvokedWithResult: (bool b,res){
              fundraiserProvider.resetPledge();
              },
              child: Scaffold(
                appBar: AppBar(
                  centerTitle: true,
                  title: Text('FULFILL PLEDGE',style: Blacks.regularSemiRoboto),
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
                      // selected pledge method
                      SelectedPledgingMethod(),
                      // conditional body rendering
                      if(fundraiserProvider.selectedPledgeMethod?.method==tukuGivingMethod)
                        TukuPledge()
                      else if(fundraiserProvider.selectedPledgeMethod?.method==mpesaGivingMethod)
                        MpesaPledge()
                      else if(fundraiserProvider.selectedPledgeMethod?.method==cardGivingMethod)
                        CardPledge()
                      else if(fundraiserProvider.selectedPledgeMethod?.method==bankGivingMethod)
                        BankPledge()
                    ],
                  ),
                ),
              ));
        });
  }
}
