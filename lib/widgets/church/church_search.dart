import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class ChurchSearch extends StatelessWidget {
  final String hint;
  final void Function(String val)? changed;
  final TextEditingController? controller;
  const ChurchSearch({super.key,
    required this.hint,
    this.changed,
    this.controller});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      height: 40,
      width: size.width,
      child: TextFormField(
        controller: controller,
        onChanged: changed,
        textInputAction: TextInputAction.search,
        cursorColor: HexColor('15411D'),
        decoration: InputDecoration(
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: HexColor('9C9C9C'),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: HexColor('9C9C9C'),
            ),
          ),
          prefixIcon: Icon(Icons.search,color: HexColor('282828')),
          hintText: hint,
          hintStyle: Grays.smallRoboto,
        ),
      ),
    );
  }
}