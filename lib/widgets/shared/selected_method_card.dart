import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

/// Reusable card for displaying currently selected payment method
/// Used in top up, send money, contributions, and pledging flows
class SelectedMethodCard extends StatelessWidget {
  final PaymentMethod? method;
  final VoidCallback onTap;
  final IconData fallbackIcon;
  final Color? accentColor;

  const SelectedMethodCard({
    super.key,
    required this.method,
    required this.onTap,
    this.fallbackIcon = HugeIcons.strokeRoundedCreditCard,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    if (method == null) return const SizedBox();

    final Color accent = accentColor ?? HexColor(AppColors.primaryGreen);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              accent,
              accent.withAlpha(180),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: accent.withAlpha(60),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: accent.withAlpha(20),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Method icon
            _MethodIcon(
              iconUrl: method!.iconUrl,
              fallbackIcon: fallbackIcon,
              accentColor: accent,
            ),
            const SizedBox(width: 14),
            // Method info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    method!.name,
                    style: Whites.regularSemiRoboto,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    method!.description ?? 'Payment method',
                    style: Whites.tinyPoppins,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Change button
            _ChangeButton(accentColor: accent),
          ],
        ),
      ),
    );
  }
}

/// Icon container for the method
class _MethodIcon extends StatelessWidget {
  final String? iconUrl;
  final IconData fallbackIcon;
  final Color accentColor;

  const _MethodIcon({
    required this.iconUrl,
    required this.fallbackIcon,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      width: 52,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: accentColor.withAlpha(40),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: iconUrl != null
          ? Image.network(
              iconUrl!,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => Icon(
                fallbackIcon,
                color: accentColor,
              ),
            )
          : Icon(
              fallbackIcon,
              color: accentColor,
            ),
    );
  }
}

/// Change button with appropriate styling
class _ChangeButton extends StatelessWidget {
  final Color accentColor;

  const _ChangeButton({required this.accentColor});

  @override
  Widget build(BuildContext context) {
    final color = HexColor(AppColors.lightGray);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: accentColor.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: HexColor(AppColors.lightGray)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Change',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            HugeIcons.strokeRoundedExchange01,
            size: 14,
            color: color,
          ),
        ],
      ),
    );
  }
}

