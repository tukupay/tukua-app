import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';
import '../../routes.dart';

class EmptyAccountsHint extends StatelessWidget {
  final bool? isBank;
  final bool? isFundraiser;
  const EmptyAccountsHint({super.key,
  this.isBank=false,
  this.isFundraiser=false});

  @override
  Widget build(BuildContext context) {
    final isForBank = isBank == true;
    final label = isForBank ? 'bank accounts' : 'wallets';
    final hint = isFundraiser == true
        ? 'No wallets available for this fundraiser'
        : 'You haven\'t created any $label yet';
    final icon = isForBank
        ? HugeIcons.strokeRoundedBank
        : HugeIcons.strokeRoundedWalletNotFound01;

    return GestureDetector(
      onTap: () {
        if (isForBank) {
          Navigator.pushNamed(context, Routes.newBank);
        } else {
          Navigator.pushNamed(context, Routes.newWallet);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: HexColor('#E8EBE9'),
          ),
          color: HexColor('#FAFBFA'),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withAlpha(15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 20,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isForBank ? 'No Bank Accounts' : 'No Wallets Found',
                    style: Blacks.smallestBoldPoppins,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hint,
                    style: Grays.smallestPoppinsHint,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen),
                    HexColor(AppColors.fadedGreen),
                  ],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Create',
                style: Whites.smallBoldRoboto,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
