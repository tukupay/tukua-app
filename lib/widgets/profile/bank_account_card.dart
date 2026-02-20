import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

import '../../routes.dart';
class BankAccountCard extends StatelessWidget {
  final FullBank bankAccount;
  final int index;
  const BankAccountCard({super.key,
  required this.bankAccount,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return  GestureDetector(
      onTap: (){
        Provider.of<BankingProvider>(context,listen: false).selectBank(bankAccount);
        Navigator.pushNamed(context, Routes.bankAccountDetails);
      },
      child: Container(
        margin: Paddings.smallestVertical,
        decoration: BoxDecoration(
          color: index%2==0? Colors.white:HexColor('#FCF9E5'),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                  offset: Offset(0, 4),
                  blurRadius: 10,
                  spreadRadius: 0,
                  color: Colors.black.withAlpha(25)
              )
            ]
        ),
        padding: Paddings.smallAllSides,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text('${formatDate(bankAccount.createdAt!)} - ${formatTime(bankAccount.createdAt!)}',
                      style: Grays.smallestPoppinsHint),
                      Spaces.smallSideSpace,
                      Container(
                        padding: Paddings.smallestAllSides,
                        decoration: BoxDecoration(
                            color: HexColor(
                                bankAccount.isActive==true?
                                AppColors.lightFadedGreen:
                            AppColors.fadedOrange)
                        ),
                        child: Text(bankAccount.isActive==true?'Active':'Disabled',style: Greens.tinySemiRoboto),
                      )
                    ],
                  ),
                  Text(bankAccount.bankName!,style: Blacks.regularBoldCodeNext),
                  Text(bankAccount.accountName??'Nameless',style: Blacks.smallestBolderPoppins,),
                  Text(hideMiddleCharacters(bankAccount.accountNumber!),style: Blacks.smallestBoldPoppins),
                ],
              ),
            ),
            Container(
              alignment: Alignment.center,
              height:50,width: 80,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: HexColor(AppColors.primaryGreen).withAlpha(14)
              ),
              child: Text(createInitials(bankAccount.accountName!)),
            )
          ],
        ),
      ),
    );
  }
}
