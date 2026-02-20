import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class TermsConditions extends StatelessWidget {
  const TermsConditions({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
        title: Text('Terms & Conditions', style: Blacks.mediumSemiRoboto),
        centerTitle: true,
      ),
      body: Center(
        child: Text('TERMS & CONDITIONS',style: Blacks.largeSemiPoppins),
      ),
    );
  }
}
