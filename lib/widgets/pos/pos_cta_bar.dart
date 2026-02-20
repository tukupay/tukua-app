import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

/// Simple CTA bar with primary action and settings link.
class PosCtaBar extends StatelessWidget {
  final VoidCallback onSettings;
  final VoidCallback onGetStarted;

  const PosCtaBar({super.key, required this.onSettings, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextButton(
            onPressed: onSettings,
            child: const Text('POS Settings'),
          ),
        ),
        const SizedBox(width: 12),
        ElevatedButton(
          onPressed: onGetStarted,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            backgroundColor: HexColor(AppColors.fadedGreen),
            foregroundColor: Colors.white,
          ),
          child: const Text('Get Started'),
        ),
      ],
    );
  }
}

