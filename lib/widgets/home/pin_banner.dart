import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../providers/providers.dart';
import '../../constants/constants.dart';

class PinBanner extends StatelessWidget {
  const PinBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (_, profile, __) {
        final needsSetup = profile.user?.requiresPinSetup == true;
        if (!needsSetup) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
          child: _MiniPinBannerCard(
            onTap: () => Navigator.pushNamed(context, Routes.transactionPin),
          ),
        );
      },
    );
  }
}

class _MiniPinBannerCard extends StatefulWidget {
  final VoidCallback onTap;
  const _MiniPinBannerCard({required this.onTap});

  @override
  State<_MiniPinBannerCard> createState() => _MiniPinBannerCardState();
}

class _MiniPinBannerCardState extends State<_MiniPinBannerCard> {
  bool _pressed = false;
  void _down(TapDownDetails _) => setState(() => _pressed = true);
  void _cancel() => setState(() => _pressed = false);
  void _up(TapUpDetails _) {
    setState(() => _pressed = false);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final primaryGreen = HexColor(AppColors.primaryGreen);
    final brightGreen = HexColor(AppColors.brightGreen);
    final fadedGreen = HexColor(AppColors.fadedGreen);
    final lightFadedGreen = HexColor(AppColors.lightFadedGreen);
    final theme = Theme.of(context);

    return GestureDetector(
      onTapDown: _down,
      onTapCancel: _cancel,
      onTapUp: _up,
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        duration: const Duration(milliseconds: 120),
        scale: _pressed ? 0.97 : 1,
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                lightFadedGreen,
                lightFadedGreen.withValues(alpha: 0.6),
                Colors.white,
              ],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: fadedGreen.withValues(alpha: 0.3),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: primaryGreen.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon container with gradient
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [primaryGreen, fadedGreen],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: HugeIcon(
                    icon: HugeIcons.strokeRoundedLockPassword,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create transaction PIN',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: primaryGreen,
                        height: 1.1,
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.clip,
                    ),
                    Text(
                      'Enable quick secure approvals',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: fadedGreen,
                        height: 1.1,
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.clip,
                    ),
                  ],
                ),
              ),
              // Action chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: brightGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: brightGreen.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Set up',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: primaryGreen,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios, color: primaryGreen, size: 10),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
