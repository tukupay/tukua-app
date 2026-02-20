import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../routes.dart';
class MyBankAccounts extends StatelessWidget {
  const MyBankAccounts({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: size.height,
      width: size.width,
      padding: Paddings.smallAllSides,
      child: Flex(
        direction: Axis.vertical,
        children: [
          Expanded(
            child: Consumer<BankingProvider>(
              builder: (_,banking,__) {
                return
                  banking.loadingAccounts?
                      // loading accounts
                      ListView.builder(
                          itemCount: 5,
                          itemBuilder: (context,index){
                            return BankAccountCardShimmer(index: index);
                          }):
                      // no accounts
                      banking.userBanks.isEmpty?
                          emptyBanks(context) :
                  ListView.builder(
                  primary: false,
                    itemCount: banking.userBanks.length,
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    itemBuilder: (context,index){
                      FullBank card=banking.userBanks[index];
                      return BankAccountCard(bankAccount: card,
                        index: index);
                    });
              }
            ),
          ),
          DottedButton(
            text: 'Add Bank Account',
            tapped: (){
              Navigator.pushNamed(context, Routes.newBank);
            },
          ),
        ],
      ),
    );
  }
}

Widget emptyBanks(BuildContext context){
  final size=MediaQuery.of(context).size;
  return SizedBox(
      width: size.width,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(HugeIcons.strokeRoundedBank,size: 55,color: HexColor(AppColors.lightGray)),
          Spaces.smallTopSpace,
          Text("No banks have been added",
          style: Grays.regularSemiInter),
          Spaces.smallTopSpace,
          Text('Tap "Add Bank Account" to add one',
          style: Greens.tinySemiRoboto)
        ],
      ));
}
