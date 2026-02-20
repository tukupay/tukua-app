import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
class BankGptChip extends StatelessWidget {
  const BankGptChip({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 190,
        alignment: Alignment.center,
        padding: Paddings.tinyAllSides,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(55),
          gradient: LinearGradient(
              colors: [
                HexColor('#DEC1FC'),
                HexColor('#FFD3C0')
              ])
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(HugeIcons.strokeRoundedAiMagic),
            Spaces.tinySideSpace,
            Text('With BankGPT AI',style: Blacks.tinyBolderPoppins)
          ],
        ),
      ),
    );
  }
}
