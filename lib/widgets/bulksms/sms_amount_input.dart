import 'package:flutter/material.dart';
import '../../constants/constants.dart';
import '../widget.dart';

class SmsAmountInput extends StatelessWidget {
  const SmsAmountInput({super.key,
    required this.controller,
    required this.onCalculate,
    required this.isLoading,
  });

  final TextEditingController controller;
  final VoidCallback onCalculate;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('How many SMS credits do you want?',
            style: Blacks.regularBoldCodeNext),
        Spaces.smallTopSpace,
        LoanTextField(
          controller: controller,
          borderColor: AppColors.lightGray,
          hint: '1000',
          isNumber: true,
        ),
        Spaces.smallTopSpace,
        Center(
          child: isLoading
              ? const WaveDots()
              : AltGreenButton(
            tapped: onCalculate,
            text: "CALCULATE COST",
          ),
        ),
      ],
    );
  }
}