import 'package:flutter/material.dart';
import 'package:tuku/providers/providers.dart';

/// Small visual widget that renders PIN entry dots.
/// Accepts the current `pin` string and optionally `dotSize` and `maxLen`.
class PinDots extends StatelessWidget {
  final String pin;
  final double dotSize;
  final int maxLen;

  const PinDots({super.key, required this.pin, required this.dotSize, this.maxLen = PinProvider.pinLength});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(maxLen, (i) {
        final filled = i < pin.length;
        final isActive = i == pin.length;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.symmetric(horizontal: 8),
          width: dotSize,
          height: dotSize,
          decoration: BoxDecoration(
            color: filled ? theme.colorScheme.primary : Colors.transparent,
            border: Border.all(
              color: isActive ? theme.colorScheme.primary : theme.dividerColor,
              width: isActive ? 2 : 1.2,
            ),
            shape: BoxShape.circle,
          ),
          child: filled
              ? Center(
                  child: Container(
                    width: dotSize * 0.45,
                    height: dotSize * 0.45,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                )
              : null,
        );
      }),
    );
  }
}

