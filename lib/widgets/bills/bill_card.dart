import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:intl/intl.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
class BillCard extends StatelessWidget {
  final Bill bill;
  final int index;
  const BillCard({super.key,
  required this.bill,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      width: size.width,
      margin: Paddings.tinyVertical,
      padding: Paddings.smallestAllSides,
      // height: 90,
      decoration: BoxDecoration(
        color: index%2==0? Colors.white:HexColor('#E4FFF2'),
        boxShadow: [
          BoxShadow(
            offset: Offset(0, 0),
            blurRadius: 6,
            spreadRadius: 0,
            color: HexColor('#333333').withAlpha(80)
          )
        ]
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 24,width: 24,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: HexColor(bill.shade)
                    ),
                    child: Icon(bill.icon,size: 14,color: Colors.white),
                  ),
                  Spaces.smallSideSpace,
                  Text(bill.category,style: Blacks.tinyBolderPoppins),
                  Spaces.tinySideSpace,
                  Text('(${bill.status})',
                    style: bill.status==Strings.overdueStatus?Reds.tinySemiRoboto:
                    bill.status==Strings.upcomingStatus?Oranges.tinySemiRoboto:
                    Greens.tinySemiRoboto,)
                ],
              ),
              Spaces.tinyTopSpace,
              Text(bill.title,style: Blacks.tinyBolderPoppins),
              Spaces.tinyTopSpace,
              Row(
                children: [
                  Text('Due: ${DateFormat.yMMMd()
                      .format(DateTime.fromMillisecondsSinceEpoch(bill.dueDate))}'),
                  Spaces.tinySideSpace,
                  bill.status!=Strings.paidStatus?
                  Text('(${index+1} ${index+1==1?'day':'days'} ago)',style:
                    bill.status==Strings.overdueStatus?Reds.tinyInter:
                    bill.status==Strings.upcomingStatus?Oranges.smallestRoboto:
                    Blacks.tinySemiJakarta,):
                  const SizedBox()
                ],
              )
            ],
          ),
          Padding(
            padding: Paddings.tinyVertical,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                bill.status==Strings.paidStatus?
                    Container(
                      height: 20,width: 60,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: HexColor('#727673'),
                        borderRadius: BorderRadius.circular(5)
                      ),
                      child: Text('PAID',style: Whites.smallestRoboto),
                    ):
                    Container(
                      alignment: Alignment.center,
                      height: 20,width: 60,
                      decoration: BoxDecoration(
                        color: HexColor('#15411D'),
                        borderRadius: BorderRadius.circular(5)
                      ),
                      child: Text('PAY',style: Whites.smallestRoboto),
                    ),
                Text('KSH ${formatThousands(amount: bill.amount.toDouble(),
                    noDecimal: true)}',style: Greens.regularSemiRoboto)
              ],
            ),
          )
        ],
      ),
    );
  }
}
