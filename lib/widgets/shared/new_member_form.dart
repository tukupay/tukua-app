import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../widget.dart';
class NewMemberForm extends StatelessWidget {
  final void Function() method;
  final TextEditingController? nameController;
  final TextEditingController? phoneController;
  final TextEditingController? emailController;
  final String? buttonText;
  const NewMemberForm({super.key,
  required this.method,
   this.nameController,
   this.phoneController,
   this.emailController,
  this.buttonText});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Public Name',style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: "John Doe",
              canGoNext: true,
              controller: nameController,
              suffixIcon: HugeIcons.strokeRoundedUser),
          Spaces.smallTopSpace,
          Text('Phone Number',style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: '0712345678',
              canGoNext: true,
              isNumber: true,
              controller: phoneController,
              suffixIcon: HugeIcons.strokeRoundedCall),
          Spaces.smallTopSpace,
          Text('Email Address',style: Blacks.tinyBoldGrotesk),
          CurvedTextField(
              hint: 'john@tuku.com',
              isEmail: true,
              controller: emailController,
              suffixIcon: HugeIcons.strokeRoundedMail01),
          Spaces.smallTopSpace,
          Spaces.mediumTopSpace,
          Center(
            child: AltGreenButton(
                tapped:method,
                text: buttonText?? 'Add Member'),
          )
        ],
      ),
    );
  }
}
