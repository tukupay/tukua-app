import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class BulkPayHeader extends StatelessWidget {
  final double? amount;
  final int recipients;
  final String? type;
  const BulkPayHeader({super.key,
    this.amount,
  required this.recipients,
  this.type});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      width: size.width,
      padding: Paddings.tinyAllSides,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: HexColor(AppColors.lightGray),
          width: 2
        ),
        borderRadius: BorderRadius.circular(8)
      ),
      child: Column(
        mainAxisSize: MainAxisSize.max,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if(amount!=null)...[
            bulkPayInfo('Total Amount', 'Ksh ${formatThousands(amount: amount!)}'),
          ],
          bulkPayInfo('Total Recipients', '$recipients'),
          if(type!=null)...[
            bulkPayInfo('Send to', type!),
          ]
        ],
      ),
    );
  }
}

Widget bulkPayInfo(String title,String content){
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(title,style: Grays.tinyPoppinsHint),
      Spaces.smallTopSpace,
      Text(content,style: Blacks.regularSemiRoboto)
    ],
  );
}
