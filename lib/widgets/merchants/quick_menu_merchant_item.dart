import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../models/models.dart';

/// Quick menu item for merchants - matches the MenuItem style used in InstantPay
class QuickMenuMerchantItem extends StatelessWidget {
  final MerchantApp merchant;
  final VoidCallback onTap;

  const QuickMenuMerchantItem({
    super.key,
    required this.merchant,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: Paddings.smallHorizontal,
        height: 80,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: Colors.transparent,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Container(
              alignment: Alignment.center,
              height: 47,
              width: 47,
              decoration: BoxDecoration(
                border: Border.all(
                  color: HexColor('#EDF1FD'),
                ),
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: merchant.iconAsset != null
                  ? ClipOval(
                      child: Image.asset(
                        Strings.iconImage(merchant.iconAsset!),
                        height: 33,
                        width: 33,
                        fit: BoxFit.cover,
                      ),
                    )
                  : Icon(
                      HugeIcons.strokeRoundedStore04,
                      size: 24,
                      color: HexColor(AppColors.primaryGreen),
                    ),
            ),
            Text(
              merchant.name,
              style: TextStyle(
                fontFamily: GoogleFonts.inter().fontFamily,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

