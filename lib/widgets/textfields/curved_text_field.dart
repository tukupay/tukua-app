import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class CurvedTextField extends StatelessWidget {
  final String hint;
  final TextEditingController? controller;
  final IconData? suffixIcon;
  final bool? multiLine;
  final bool? canGoNext;
  final bool? isNumber;
  final bool? isEmail;
  final bool? enabled;
  final String? Function(String?)? validator;
  const CurvedTextField({super.key,
  required this.hint,
  this.controller,
  this.suffixIcon,
  this.multiLine,
  this.canGoNext,
  this.isNumber,
  this.isEmail,
  this.enabled,
  this.validator});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      enabled: enabled,
      controller: controller,
      minLines: multiLine==true?4:null,
      maxLines: multiLine==true?null:1,
      textInputAction: canGoNext==true ? TextInputAction.next:null,
      keyboardType: isNumber==true?TextInputType.number:
      isEmail==true?TextInputType.emailAddress:TextInputType.text,
      validator: validator,
      decoration: InputDecoration(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(
            color: HexColor('#544C4C').withAlpha(60)
          )
        ),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide(
                color: HexColor('#544C4C').withAlpha(60)
            )
        ),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide(
                color: HexColor('#544C4C').withAlpha(60)
            )
        ),
        hintText: hint,
        hintStyle: Grays.tinyPoppinsHint,
        suffixIcon: suffixIcon!=null? Icon(suffixIcon,
          size: 20,
          color: HexColor('#7C7C7C'),):null
      ),
    );
  }
}
