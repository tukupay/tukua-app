import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class InputAmountAlert extends StatelessWidget {
  final TextEditingController amountController;
  final void Function() tapped;
  final bool showBalance;
  final double balance;
  const InputAmountAlert({super.key,
    required this.amountController,
  required this.tapped,
  this.showBalance=false,
  this.balance=0});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return AlertDialog(
      contentPadding: EdgeInsets.zero,
      elevation: 0,
      backgroundColor: Colors.white,
      content: Container(
        padding: Paddings.tinyAllSides,
        height: 250,
        width: size.width/1.2,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text("Enter Amount",style: Blacks.mediumSemiPoppins),
            Spaces.smallTopSpace,
            LoanTextField(
              borderColor: AppColors.lightGray,
                hint: "Input Amount",
                controller: amountController,
                isNumber: true,
                suffixText: 'Ksh'),
            Spaces.smallTopSpace,
            showBalance==true?Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text("Wallet Balance : ",style: Blacks.regularBoldGrotesk),
                Spaces.tinySideSpace,
                Text('Ksh${formatThousands(amount: balance)}',style: Oranges.regularSemiInter)
              ],
            ): const SizedBox(),
            Spaces.smallTopSpace,
            AltGreenButton(
                tapped: tapped,
                text: "SEND")
          ],
        ),
      ),
    );
  }
}
