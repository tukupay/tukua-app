import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
class BulkSmsCosts extends StatelessWidget {
  const BulkSmsCosts({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.tinyAllSides,
      child: Consumer<CreditsProvider>(
        builder: (_,credits,__) {
          return credits.loadingTransactionHistory?
              const Center(child: CircularProgressIndicator()):
              credits.transactionHistory==null||
                  credits.transactionHistory!.transactions==null||
                  credits.transactionHistory!.transactions!.isEmpty?
              SizedBox(
                width: size.width,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(HugeIcons.strokeRoundedMessageDone01,size: 45,
                        color: HexColor(AppColors.lightGray)),
                    Spaces.smallTopSpace,
                    Text("Your SMS usage will appear here",style: Grays.smallRoboto)
                  ],
                ),
              ):
              ListView.builder(
                  shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  itemCount: credits.transactionHistory?.transactions?.length??0,
                  itemBuilder: (context,index){
                    SmsTransactionItem transactionItem=credits.transactionHistory!.transactions![index];
                    return Container(
                      margin: Paddings.tinyVertical,
                      padding: Paddings.smallestAllSides,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: HexColor(AppColors.lightGray)
                        )
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(transactionItem.description??'-',style: Blacks.regularBoldCodeNext),
                          Text('${transactionItem.smsCount} SMSs sent',style: Grays.tinyPoppinsHint),
                          Text('Cost Ksh. ${formatThousands(amount:transactionItem.amount,noDecimal: true)}',
                              style: Grays.tinyPoppinsHint)
                        ],
                      ),
                    );
                  });
        }
      ),
    );
  }
}
