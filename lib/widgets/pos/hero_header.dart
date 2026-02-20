import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Small hero header used on POS landing. Keeps visual parity with the app's style.
class HeroHeader extends StatelessWidget {
  final Animation<double>? fade;
  final Animation<Offset>? slide;

  const HeroHeader({super.key, this.fade, this.slide});

  @override
  Widget build(BuildContext context) {
    final child = Row(
      children: [
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                HexColor(AppColors.fadedGreen).withValues(alpha: 0.30),
                HexColor(AppColors.fadedGreen).withValues(alpha: 0.05),
              ],
              radius: 0.85,
            ),
          ),
          padding: const EdgeInsets.all(10),
          child: Icon(
            HugeIcons.strokeRoundedStore04,
            size: 22,
            color: HexColor(AppColors.fadedGreen),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Turn your phone into a POS', style: Blacks.regularBoldGrotesk),
              const SizedBox(height: 4),
              Text('Frictionless M-Pesa payment requests in person.', style: Grays.smallestBolderPoppinsHint),
            ],
          ),
        )
      ],
    );

    if (fade != null && slide != null) {
      return FadeTransition(
        opacity: fade!,
        child: SlideTransition(position: slide!, child: child),
      );
    }
    return child;
  }
}
