import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

import '../widget.dart';
class CardAccountCard extends StatelessWidget {
  final int index;
  final CardAccount cardAccount;
  const CardAccountCard({super.key,
    required this.index,
  required this.cardAccount});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      margin: EdgeInsets.symmetric(
        vertical: 8
      ),
      height: 240,
      width: size.width,
      child: Column(
        children: [
          GestureDetector(
            onTap: (){
              showModalBottomSheet(
                  context: context,
                  scrollControlDisabledMaxHeightRatio: 1/1,
                  builder: (context){
                    return NewAccountForm(
                      title: "Edit/Delete Card",
                      isNew: false,
                    );
                  });
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text('Edit',style: Blacks.tinyBolderPoppins),
                Spaces.tinySideSpace,
                Icon(Icons.edit,color: HexColor('#E85D1C'))
              ],
            ),
          ),
          Spaces.smallTopSpace,
          Container(
            width: size.width,
            padding: Paddings.smallAllSides,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: index%2==0?
              HexColor('#15411D'):
              HexColor('#ED713C')
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Icon(Icons.visibility_off,
                              color: Colors.white.withAlpha(50)),
                            Spaces.smallSideSpace,
                            Text('Current Balance',
                            style: Whites.tinyFaintRoboto)
                          ],
                        ),
                      ],
                    ),
                    HugeIcon(
                        icon: HugeIcons.strokeRoundedCircleLockCheck01,
                        color: Colors.white.withAlpha(50))
                  ],
                ),
                Spaces.smallTopSpace,
                Text(formatThousands(amount: cardAccount.balance.toDouble()),
                    style: Whites.mediumBoldRoboto),
                Spaces.smallTopSpace,
                Text(cardAccount.cardNumber,style: Whites.mediumSemiRoboto),
                Spaces.smallTopSpace,
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Card Holder',style: Whites.tinyFaintRoboto),
                        Spaces.tinyTopSpace,
                        Text(cardAccount.cardHolder,
                        style: Whites.smallBoldRoboto)
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Expiry',style: Whites.tinyFaintRoboto),
                        Spaces.tinyTopSpace,
                        Text(cardAccount.expiry,
                            style: Whites.smallBoldRoboto)
                      ],
                    ),
                    Text(cardAccount.type,style: Whites.smallBoldRoboto)
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
