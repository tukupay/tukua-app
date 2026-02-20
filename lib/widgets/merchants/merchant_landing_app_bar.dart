import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// App bar for the merchants landing page
class MerchantLandingAppBar extends StatelessWidget {
  const MerchantLandingAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withAlpha(200),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: Icon(
              HugeIcons.strokeRoundedArrowLeft01,
              color: HexColor(AppColors.primaryGreen),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Merchants & Mini Apps', style: Blacks.regularBoldCodeNext),
                Text(
                  'Discover apps built for your lifestyle',
                  style: Grays.tinyPoppinsHint,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

