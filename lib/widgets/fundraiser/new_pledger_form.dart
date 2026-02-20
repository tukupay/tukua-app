import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class NewPledgerForm extends StatelessWidget {
  final TextEditingController? nameController;
  final bool? nameEnabled;
  final TextEditingController? phoneController;
  final bool? phoneEnabled;
  final TextEditingController? emailController;
  final bool? emailEnabled;
  final TextEditingController? amountController;
  final String? textButton;
  final void Function() tapped;
  const NewPledgerForm({super.key,
    required this.nameController,
    this.nameEnabled,
    required this.phoneController,
    this.phoneEnabled,
    required this.emailController,
    this.emailEnabled,
    required this.amountController,
    this.textButton,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Personal Details",style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: "John Doe",
          canGoNext: true,
            enabled: nameEnabled,
            controller: nameController,
            suffixIcon: HugeIcons.strokeRoundedUser,
          ),
          Spaces.smallTopSpace,
          CurvedTextField(
              hint: "0712345678",
            canGoNext: true,
            enabled: phoneEnabled,
            isNumber: true,
            controller: phoneController,
            suffixIcon: HugeIcons.strokeRoundedCall,
          ),
          Spaces.smallTopSpace,
          CurvedTextField(
              hint: "john@tuku.com",
            isEmail: true,
            controller: emailController,
            enabled: emailEnabled,
            suffixIcon: HugeIcons.strokeRoundedMail01,
          ),
          Spaces.smallTopSpace,
          Text("Pledge Details",style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              isNumber: true,
              hint: "Pledge Amount",
            controller: amountController,
            suffixIcon: HugeIcons.strokeRoundedMoneySavingJar),
          Spaces.smallTopSpace,
          Center(
            child: AltGreenButton(
                tapped: tapped,
                text: textButton??"Add"),
          )
        ],
      )
    );
  }
}
