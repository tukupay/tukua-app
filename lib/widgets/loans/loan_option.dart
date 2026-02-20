import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';

import '../../providers/providers.dart';
class LoanOption extends StatelessWidget {
  final void Function() tapped;
  final IconData icon;
  final String option;
  const LoanOption({super.key,
    required this.tapped,
  required this.icon,
  required this.option});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: tapped,
      child: SizedBox(
        height: 65,width: 80,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Consumer<LoanProvider>(
              builder: (_,loanProvider,__) {
                return Container(
                  height: 46,width: 46,
                  decoration: BoxDecoration(
                    color: loanProvider.selectedOption==option?
                    HexColor('#15411D'): HexColor('#E7E7E7'),
                    borderRadius: BorderRadius.circular(8)
                  ),
                  child: Icon(icon,
                      color:loanProvider.selectedOption==option?
                      Colors.white: HexColor('#727673')),
                );
              }
            ),
            Text(option,style: Grays.tinySemiKarla)
          ],
        ),
      ),
    );
  }
}
