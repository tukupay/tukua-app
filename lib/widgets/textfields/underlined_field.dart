import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
class UnderlinedField extends StatelessWidget {
  final String hint;
  final TextEditingController controller;
  final void Function(String? val) changed;
  const UnderlinedField({super.key,
  required this.hint,
  required this.controller,
  required this.changed});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Center(
      child: SizedBox(
        width: size.width/1.5,
        child: TextFormField(
          onChanged: changed,
          controller: controller,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              fontFamily: GoogleFonts.dmSans().fontFamily,
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
            border: UnderlineInputBorder(),
            enabledBorder: UnderlineInputBorder(),
            focusedBorder: UnderlineInputBorder(),
            errorBorder: UnderlineInputBorder()
          ),
        ),
      ),
    );
  }
}
