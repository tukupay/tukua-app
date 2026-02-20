import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../widget.dart';

class PinAndSummary extends StatelessWidget {
  final Widget summary;
  const PinAndSummary({super.key,
  required this.summary});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.smallAllSides,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Pinput(
            length: 4,
            defaultPinTheme: PinTheme(
              height: 70,width: 70,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    offset: Offset(0, 4),
                    blurRadius: 4,
                    spreadRadius: 0,
                    color: Colors.black26
                  ),
                  BoxShadow(
                      offset: Offset(1, 0),
                      blurRadius: 4,
                      spreadRadius: 0,
                      color: Colors.black26
                  ),
                ]
              )
            ),
          ),
          Spaces.smallTopSpace,
          Text('Enter Pin',
          style: Blacks.mediumSemiRoboto),
          Spaces.mediumTopSpace,
          summary,
          Spaces.mediumTopSpace,
          SheetButton(
            enabled: true,
            text: 'Confirm & Pay',
              hasIcon: false,
              tapped: (){
                Provider.of<DummyPaymentProvider>(context,listen: false).processPayment();
                showModalBottomSheet(
                    scrollControlDisabledMaxHeightRatio: 1/1,
                    context: context,
                    builder: (context){
                      return DecoratedSheet(
                        hasCounter: false,
                        height: 550,
                        title: 'Processing',
                        body: Processing(),
                      );
                    });
              })
        ],
      ),
    );
  }
}
