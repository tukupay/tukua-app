import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

class PaymentLinks extends StatelessWidget {
  const PaymentLinks({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text('Payment Links', style: Blacks.regularBoldCodeNext),
            GestureDetector(
                onTap: () {
                  Fluttertoast.cancel();
                  Fluttertoast.showToast(msg: 'To all payment links?');
                },
                child: Text('View All', style: Greens.smallBoldInter))
          ],
        ),
        Spaces.smallTopSpace,
        ListView.builder(
            shrinkWrap: true,
            itemCount: 3,
            physics: NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              return Container(
                margin: Paddings.smallestVertical,
                child: Row(
                  children: [
                    Container(
                      padding: Paddings.smallAllSides,
                      decoration: BoxDecoration(
                          color: HexColor('#DDFFE8'),
                          borderRadius: BorderRadius.circular(14)),
                      child: Icon(Icons.link),
                    ),
                    Spaces.smallSideSpace,
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Payment Link ${index + 1}',
                            style: Blacks.regularCairo),
                        Text(
                          'Sample: link ${index + 1}',
                          style: Grays.smallRoboto,
                        )
                      ],
                    )
                  ],
                ),
              );
            }),
        Spaces.smallTopSpace,
        SmsNewButton(
          text: 'Add New Payment Link',
          tapped: () {
            Fluttertoast.cancel();
            Fluttertoast.showToast(msg: 'New payment link?');
          },
        ),
      ],
    );
  }
}
