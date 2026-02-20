import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../widgets/widget.dart';
class Paybill extends StatelessWidget {
  const Paybill({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: Paddings.tinyAllSides,
      child: Column(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Spaces.smallTopSpace,
                WalletMpesaDropdowns(enabled: true),
                Spaces.smallTopSpace,
                Text('Favourites',style: Blacks.mediumSemiRubik),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () {
                    Fluttertoast.cancel();
                    Fluttertoast.showToast(msg: "Add a favourite paybill");
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: HexColor('#E8EBE9')),
                      color: HexColor('#FAFBFA'),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: HexColor(AppColors.primaryGreen).withAlpha(15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            HugeIcons.strokeRoundedFavourite,
                            size: 18,
                            color: HexColor(AppColors.darkerGray2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('No favourites yet', style: Blacks.smallestBoldPoppins),
                              const SizedBox(height: 2),
                              Text('Save paybills for quick access', style: Grays.smallestPoppinsHint),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: HexColor(AppColors.primaryGreen).withAlpha(15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            HugeIcons.strokeRoundedAdd01,
                            size: 16,
                            color: HexColor(AppColors.primaryGreen),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Spaces.smallTopSpace,
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: LabeledField(
                          label: 'Enter Pay Bill no.',
                          hint: '0-10 characters',
                          isNumber: true,
                          enabled: true),
                    ),
                    Spaces.tinySideSpace,
                    RoundButton(
                        tapped: (){
                          Fluttertoast.showToast(msg: 'TO CAPTURE');
                        },
                        icon: Icons.camera_alt),
                  ],
                ),
                Spaces.smallTopSpace,
                LabeledField(
                    label: 'Enter Account no',
                    hint: '0-10 characters',
                    isNumber: true,
                    enabled: true),
                Spaces.smallTopSpace,
                LabeledField(
                    label: 'Enter Amount',
                    hint: '0',
                    isNumber: true,
                    enabled: true),
                Text('Balance: Ksh. 200',style: Grays.tinyPoppinsHint)
              ],
            ),
          ),
          AltGreenButton(
              tapped: (){},
              text: "Proceed")
        ],
      ),
    );
  }
}
