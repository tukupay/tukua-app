import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';

import '../../providers/providers.dart';

class LoanHistory extends StatefulWidget {
  const LoanHistory({super.key});

  @override
  State<LoanHistory> createState() => _LoanHistoryState();
}

class _LoanHistoryState extends State<LoanHistory> {
  TextEditingController searchController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<LoanProvider>(context, listen: false).resetOption();
      },
      child: Scaffold(
          appBar: AppBar(
            leading: IconButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
            title: Text('Loan History', style: Blacks.mediumSemiRoboto),
            centerTitle: true,
            actions: [
              GestureDetector(
                onTap: () {
                  const snackBar = SnackBar(content: Text('To SETTINGS?'));
                  ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(snackBar);
                },
                child: Icon(HugeIcons.strokeRoundedSettings01,
                    color: Colors.black),
              ),
              Spaces.smallSideSpace,
            ],
          ),
          body: SizedBox(
            height: size.height,
            width: size.width,
            child: SingleChildScrollView(
              padding: Paddings.smallAllSides,
              primary: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      SizedBox(
                          width: size.width/1.7,
                          child: AuthTextField(
                              hint: 'Search History',
                            controller: searchController)),
                      Spaces.tinySideSpace,
                      GestureDetector(
                        onTap: () {},
                        child: Container(
                          height: 42,
                          width: 42,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: Colors.white,
                              border: Border.all(color: HexColor('#E0E8F2'))),
                          child: Icon(Icons.search, color: Colors.black),
                        ),
                      ),
                      Spaces.tinySideSpace,
                      GestureDetector(
                          onTap: () {},
                          child: Container(
                            height: 42,
                            width: 42,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                color: Colors.white,
                                border:
                                    Border.all(color: HexColor('#E0E8F2'))),
                            child: Icon(Icons.sort, color: Colors.black),
                          )),
                    ],
                  ),
                  Spaces.smallTopSpace,
                  Container(
                    alignment: Alignment.center,
                    height: 35,
                    width: 90,
                    decoration: BoxDecoration(
                        color: HexColor('#FCF9E5'),
                        border: Border.all(
                            color: HexColor('#E0E8F2').withAlpha(120)),
                        borderRadius: BorderRadius.circular(8)),
                    child: Text('This Week', style: Blacks.tinyRoboto),
                  ),
                  Spaces.tinyTopSpace,
                  ListView.builder(
                      shrinkWrap: true,
                      primary: false,
                      padding: EdgeInsets.zero,
                      itemCount: loanHistory.length,
                      itemBuilder: (context, index) {
                        Loan loan = loanHistory[index];
                        return PastLoanCard(loan: loan, index: index);
                      })
                ],
              ),
            ),
          )),
    );
  }
}
