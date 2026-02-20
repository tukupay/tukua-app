import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

import '../widget.dart';
class PaymentMethodCard extends StatelessWidget {
  final DummyPaymentMethod paymentMethod;
  const PaymentMethodCard({super.key,
  required this.paymentMethod});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(paymentMethod.method,
                  style: Blacks.regularSemiPoppins),
              Radio(
                  value: paymentMethod.method,
                  groupValue: 'Tuku Pay Wallet',
                  activeColor: HexColor('#EE7D13'),
                  onChanged: (val){
                    final snackBar=SnackBar(content: Text('Change to $val'));
                    ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                    ScaffoldMessenger.of(context).showSnackBar(snackBar);
                  })
            ],
          ),
          Spaces.tinyTopSpace,
          Text(paymentMethod.phoneNumber!=null?'Phone Number':
          paymentMethod.accountNumber!=null?'Account Number':
          paymentMethod.walletNumber!=null?'Wallet Number':
          paymentMethod.cardName!=null?'Card Holder Name':'',
              style: Grays.regularPoppins),
          AuthTextField(
            hint: paymentMethod.method,
            initialText: paymentMethod.phoneNumber??paymentMethod.accountNumber??
                paymentMethod.walletNumber??paymentMethod.cardName,
          ),
          Spaces.smallTopSpace,
          paymentMethod.branch!=null?
          Text('Bank Name/Branch',
              style: Grays.regularPoppins):const SizedBox(),
          Spaces.tinyTopSpace,
          paymentMethod.branch!=null?
          AuthTextField(
            hint: paymentMethod.branch!,
            initialText: paymentMethod.branch,
          ):const SizedBox(),
          Spaces.tinyTopSpace,
          paymentMethod.cardNumber!=null?
          Text('Card Number',
              style: Grays.regularPoppins):const SizedBox(),
          paymentMethod.cardNumber!=null?
              AuthTextField(hint: 'CARD NUMBER AS IN THE CARD',
              initialText: paymentMethod.cardNumber):const SizedBox()
        ],
      ),
    );
  }
}
