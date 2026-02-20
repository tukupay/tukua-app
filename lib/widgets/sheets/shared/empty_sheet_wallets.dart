import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
class EmptySheetWallets extends StatelessWidget {
  const EmptySheetWallets({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedWalletNotFound01,
              size: 40,
              color: HexColor(AppColors.darkerGray2),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No Wallets Found',
            style: Blacks.regularBoldCodeNext,
          ),
          const SizedBox(height: 6),
          Text(
            'Create a wallet to start transacting',
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, Routes.newWallet);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen),
                    HexColor(AppColors.fadedGreen),
                  ],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Create Wallet',
                style: Whites.smallBoldRoboto,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
