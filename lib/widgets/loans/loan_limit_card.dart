import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
class LoanLimitCard extends StatelessWidget {
  const LoanLimitCard({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 125,width: size.width,
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: HexColor('#15411D'),
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('loaneclipse.png')),
              fit: BoxFit.contain,
              alignment: Alignment.topRight)
      ),
      child: Stack(
        children: [
          Positioned(
              bottom: 0,
              left: 0,
              child: Image.asset(Strings.imageAsset('loaneclipse2.png'),
                  fit: BoxFit.contain,
                  height: 80)),
          Positioned(
              top: 5,
              right: 5,
              child: Image.asset(Strings.imageAsset('hold.png'),
                  height: 60,width: 60,fit: BoxFit.contain)),
          Positioned(
              left: 10,
              top: 8,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Loan Limit',style: Whites.smallSemiKarla),
                  Text('KES 30,000',style: Whites.largeKarlaBold),
                  GestureDetector(
                    onTap: (){
                      Navigator.pushNamed(context, Routes.applyLoan);
                    },
                    child: Container(
                      height: 40,width: 100,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(7),
                          color: HexColor('#F5F5F5')
                      ),
                      child: Text('Apply',
                          style: Blacks.tinyRoboto),
                    ),
                  )
                ],
              ))
        ],
      ),
    );
  }
}
