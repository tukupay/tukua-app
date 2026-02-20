import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class LoansLanding extends StatelessWidget {
  const LoansLanding({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
        appBar: AppBar(
          title: Text('Loans', style: Blacks.mediumSemiRoboto),
          centerTitle: true,
          actions: [
            NotificationsBell(),
            Spaces.smallSideSpace
          ],
        ),
        body: Container(
          height: size.height,
          width: size.width,
          decoration: BoxDecoration(
            image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
            fit: BoxFit.cover)
          ),
          child: Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('gradient1.png')),
                    fit: BoxFit.cover)
            ),
            child: SizedBox(
              child: SingleChildScrollView(
                primary: true,
                padding: Paddings.smallAllSides,
                child: Consumer<LoanProvider>(
                  builder: (_,loanProvider,__) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LoanLimitCard(),
                        Spaces.tinyTopSpace,
                        LoanOptions(),
                        Spaces.smallTopSpace,
                        Text(loanProvider.selectedOption=='Payback'?
                        'Recent Loan':'Recent Loans'),
                        Spaces.tinyTopSpace,
                        loanProvider.selectedOption=='Payback'?
                        LoanReceipt():
                        ListView.builder(
                          itemCount: 4,
                            shrinkWrap: true,
                            primary: false,
                            padding: EdgeInsets.zero,
                            itemBuilder: (context,index){
                            Loan loan=loanHistory[index];
                            return PastLoanCard(loan: loan, index: index);
                            })
                      ],
                    );
                  }
                ),
              ),
            ),
          ),
        ));
  }
}
