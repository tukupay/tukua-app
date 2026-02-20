import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class AuthTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String hint;
  final String? initialText;
  final bool? obscure;
  final bool? isPassword;
  final IconData? obscureIcon;
  final void Function()? suffixTap;
  final bool? numbers;
  final bool? email;
  final bool? goNext;
  final bool? prefix;
  final String? Function(String?)? validator;
  final void Function(String)? changed;
  final bool? isKyc;
  final bool? disabled;

  const AuthTextField({super.key,
    this.controller,
    required this.hint,
    this.initialText,
    this.obscure,
    this.isPassword,
    this.obscureIcon,
    this.suffixTap,
    this.numbers,
    this.email,
    this.prefix,
    this.goNext=true,
    this.validator,
    this.changed,
    this.isKyc=false,
    this.disabled});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      height: isKyc==true?null: 45,
      child: TextFormField(
        enabled: disabled!=true,
        onChanged: changed,
        validator: validator,
        controller: controller,
        obscureText: obscure??false,
        initialValue: initialText,
        textInputAction: goNext==true? TextInputAction.next:TextInputAction.done,
        keyboardType: numbers==true?TextInputType.number:
            email==true?TextInputType.emailAddress :TextInputType.text,
        decoration: InputDecoration(
          prefix: prefix==true?
          Padding(
            padding: const EdgeInsets.only(top: 2.0, right: 4),
            child: Text('+254'),
          ):const SizedBox(),
          suffixIcon: obscureIcon!=null || isPassword==true?
          IconButton(
            icon: Icon(obscureIcon),
            onPressed: suffixTap,
          ):const SizedBox(),
          border: OutlineInputBorder(
            borderSide: BorderSide(
              color: HexColor('8B8B8B'),
              width: 1
            ),
            borderRadius: BorderRadius.circular(10)
          ),
          enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(
                  color: HexColor('8B8B8B'),
                  width: 1
              ),
              borderRadius: BorderRadius.circular(10)
          ),
          focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(
                  color: HexColor('8B8B8B'),
                  width: 1
              ),
              borderRadius: BorderRadius.circular(10)
          ),
          errorBorder: OutlineInputBorder(
              borderSide: BorderSide(
                  color: HexColor('FF0000'),
                  width: 1
              ),
              borderRadius: BorderRadius.circular(10)
          ),
          hintText: hint,
          hintStyle: Grays.tinyPoppinsHint
        ),
      ),
    );
  }
}
