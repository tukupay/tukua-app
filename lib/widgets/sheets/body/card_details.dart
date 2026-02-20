import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:tuku/constants/constants.dart';
import '../../../widgets/widget.dart';
import '../../../services/services.dart';

class CardDetails extends StatelessWidget {

  final TextEditingController cardNameController;
  final TextEditingController cardNumberController;
  final TextEditingController expiryDateController;
  final TextEditingController securityCodeController;

  final void Function() tapped;

  const CardDetails({super.key,
  required this.cardNameController,
  required this.cardNumberController,
  required this.expiryDateController,
  required this.securityCodeController,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      child: Padding(
          padding: Paddings.smallAllSides,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // card name
          LabeledField(
              controller: cardNameController,
              label: 'Enter Card Name',
              hint: 'eg PETER GRIFFIN',
              canGoNext: true,
              enabled: true),
          Spaces.smallTopSpace,
          // card number
          LabeledField(
              label: 'Card Number',
              hint: '0000 0000 0000 0000',
              controller: cardNumberController,
              canGoNext: true,
              isNumber: true,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly, // Allow only digits
                CardNumberFormatter(), // Custom formatter to add spaces
              ],
              enabled: true),
          Spaces.smallTopSpace,
          Row(
            children: [
              // expiry date
              Flexible(
                child: LabeledField(
                  label: 'Expiration Date',
                  hint: 'MM/YYYY',
                  controller: expiryDateController,
                  canGoNext: true,
                  isNumber: true,
                  enabled: true,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly, // Allow only digits
                    ExpiryDateFormatter(), // Custom formatter to insert "/"
                  ],
                ),
              ),
              Spaces.smallSideSpace,
              // security code
              Flexible(
                child: LabeledField(
                    label: 'Security Code',
                    hint: 'CVV/CVC',
                    canGoNext: false,
                    controller: securityCodeController,
                    isNumber: true,
                    enabled: true),
              )
            ],
          ),
          Spaces.mediumTopSpace,
          SizedBox(
            width: size.width,
            child: SheetButton(
                enabled: true,
                tapped: tapped,
                text: "Process Payment"),
          )
        ],
      )),
    );
  }
}
