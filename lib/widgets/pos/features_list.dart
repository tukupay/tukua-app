import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import 'bullet.dart';
import 'step.dart';

/// Compact features section composed from existing StepWidget and Bullet.
class FeaturesList extends StatelessWidget {
  const FeaturesList({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            StepWidget(icon: HugeIcons.strokeRoundedMoneySend01, label: 'Enter amount'),
            StepWidget(icon: HugeIcons.strokeRoundedNotification03, label: 'Customer prompt'),
            StepWidget(icon: HugeIcons.strokeRoundedPaymentSuccess01, label: 'Payment done'),
          ],
        ),
        const SizedBox(height: 14),
        Bullet(icon: HugeIcons.strokeRoundedStore04, text: 'No integration needed — start in seconds'),
        Bullet(icon: HugeIcons.strokeRoundedEdit01, text: 'Flexible amounts — add a contextual note'),
        Bullet(icon: HugeIcons.strokeRoundedTimeQuarter, text: 'History & tracking for transparency'),
      ],
    );
  }
}
