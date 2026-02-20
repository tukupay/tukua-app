import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

class IntroCard extends StatelessWidget {
  final VoidCallback onSettings;
  final VoidCallback onGetStarted;
  const IntroCard({super.key, required this.onSettings, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: HexColor(AppColors.lightGray), width: 1),
      ),
      color: theme.colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Accept payments instantly', style: Blacks.regularBoldGrotesk),
            const SizedBox(height: 6),
            Text(
              'Prompt customers with an M-Pesa request — they simply confirm with their PIN.',
              style: Grays.smallestBolderPoppinsHint,
            ),
            const SizedBox(height: 12),
            // Compact summary — detailed steps are now in FeaturesList to avoid repetition
            Row(
              children: [
                Icon(HugeIcons.strokeRoundedStore04, size: 18, color: HexColor(AppColors.fadedGreen)),
                const SizedBox(width: 8),
                Expanded(child: Text('Start taking payments in seconds — no integration required.', style: Grays.smallestBolderPoppinsHint)),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
