import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class LoanTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String hint;
  final bool? enabled;
  final bool? multiline;
  final String? initialText;
  final String? borderColor;
  final bool? isNumber;
  final bool? canGoNext;
  final Icon? prefixIcon;
  final String? suffixText;
  final void Function(String? val)? changed;
  final List<TextInputFormatter>? inputFormatters;
  final Widget? suffixIcon;
  final bool hasError;
  const LoanTextField({super.key,
    this.controller,
    required this.hint,
    this.enabled=true,
    this.multiline=false,
    this.initialText,
    this.borderColor,
    this.isNumber,
    this.changed,
    this.canGoNext,
    this.prefixIcon,
    this.suffixText,
  this.inputFormatters,
  this.suffixIcon,
  this.hasError = false});

  @override
  State<LoanTextField> createState() => _LoanTextFieldState();
}

class _LoanTextFieldState extends State<LoanTextField> {
  @override
  Widget build(BuildContext context) {
    final errorColor = const Color(0xFFE53935);
    final normalColor = HexColor(widget.borderColor ?? '#333333');
    final activeBorderColor = widget.hasError ? errorColor : normalColor;

    return TextFormField(
      inputFormatters: widget.inputFormatters,
      initialValue: widget.initialText,
      minLines: widget.multiline==true?4:1,
      maxLines: null,
      enabled: widget.enabled,
      keyboardType: widget.isNumber==true?TextInputType.number:TextInputType.text,
      controller: widget.controller,
      onChanged: widget.changed,
      textInputAction: widget.canGoNext==true?TextInputAction.next:TextInputAction.done,
      cursorColor: HexColor('#15411D'),
      decoration: InputDecoration(
        suffixText: widget.suffixText,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: activeBorderColor, width: widget.hasError ? 1.5 : 1)
        ),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: activeBorderColor, width: widget.hasError ? 1.5 : 1)
        ),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: widget.hasError ? errorColor : HexColor('#15411D'), width: widget.hasError ? 1.5 : 1)
        ),
        hintText: widget.hint,
        hintStyle: Grays.tinyPoppinsHint,
        suffixIcon: widget.suffixIcon
      ),
    );
  }
}
