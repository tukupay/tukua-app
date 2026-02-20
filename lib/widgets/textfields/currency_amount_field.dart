import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';
class CurrencyAmountField extends StatefulWidget {
  final TextEditingController controller;
  const CurrencyAmountField({super.key,
  required this.controller});

  @override
  State<CurrencyAmountField> createState() => _CurrencyAmountFieldState();
}

class _CurrencyAmountFieldState extends State<CurrencyAmountField> {
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 56,
      width: size.width,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: HexColor('#333333').withAlpha(45)
          )
      ),
      child: Row(
        children: [
          Container(
            alignment: Alignment.center,
            height: 56,width: 96,
            decoration: BoxDecoration(
                color: HexColor('#15411D'),
                borderRadius: BorderRadius.circular(8)
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('KSH',style: Whites.regularSemiRoboto),
                Spaces.smallSideSpace,
                Icon(Icons.arrow_drop_down_circle_sharp,color: Colors.white)
              ],
            ),
          ),
          Expanded(
              child: TextFormField(
                cursorColor: HexColor('#15411D'),
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.done,
                controller: widget.controller,
                decoration: InputDecoration(
                    border: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.transparent)
                    ),
                    enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.transparent)
                    ),
                    focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.transparent)
                    ),
                    hintText: '15,900.00',
                    hintStyle: Grays.tinyPoppinsHint
                ),
              ))
        ],
      ),
    );
  }
}
