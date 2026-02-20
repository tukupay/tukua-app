import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class LoanOptions extends StatelessWidget {
  const LoanOptions({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 100,
      width: size.width,
      decoration: BoxDecoration(
        color: HexColor('#F5F5F5'),
        borderRadius: BorderRadius.circular(8)
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          LoanOption(
              icon: HugeIcons.strokeRoundedBank,
              option: 'Borrow',
          tapped: (){
                Provider.of<LoanProvider>(context,listen: false).selectOption('Borrow');
                Navigator.pushNamed(context, Routes.applyLoan);
          },),
          LoanOption(
              icon: HugeIcons.strokeRoundedPayment02,
              option: 'Payback',
          tapped: (){
            Provider.of<LoanProvider>(context,listen: false).selectOption('Payback');
          }),
          LoanOption(
              icon: HugeIcons.strokeRoundedInvoice,
              option: 'History',
          tapped: (){
            Provider.of<LoanProvider>(context,listen: false).selectOption('History');
                Navigator.pushNamed(context, Routes.loanHistory);
          },),
        ],
      ),
    );
  }
}
