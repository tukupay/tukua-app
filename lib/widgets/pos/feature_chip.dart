import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

class FeatureChip extends StatelessWidget {
  final String label;
  final VoidCallback? onClose;
  const FeatureChip({super.key, required this.label, this.onClose});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: HexColor(AppColors.fadedGreen).withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: HexColor(AppColors.fadedGreen).withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(HugeIcons.strokeRoundedStore04, size: 14, color: HexColor(AppColors.fadedGreen)),
            const SizedBox(width: 6),
            Text(label, style: Grays.smallestBolderPoppinsHint),
            if(onClose!=null) ...[
              const SizedBox(width: 8),
              GestureDetector(onTap: onClose, child: Icon(Icons.close, size: 14, color: HexColor(AppColors.lightGray)))
            ]
          ],
        ),
      ),
    );
  }
}

