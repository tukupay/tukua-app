import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../providers/providers.dart';
import '../../constants/constants.dart';

/// Banner to show when there are pending signatory requests
/// Matches the style of PinBanner, EmailVerificationBanner, etc.
class PendingSignatoriesBanner extends StatelessWidget {
  const PendingSignatoriesBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SignatoryProvider>(
      builder: (_, signatory, __) {
        final pendingCount = signatory.pendingRequestsCount;
        if (pendingCount <= 0) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
          child: _MiniPendingSignatoriesBannerCard(
            pendingCount: pendingCount,
            onTap: () => Navigator.pushNamed(context, Routes.signatories),
          ),
        );
      },
    );
  }
}

class _MiniPendingSignatoriesBannerCard extends StatefulWidget {
  final int pendingCount;
  final VoidCallback onTap;

  const _MiniPendingSignatoriesBannerCard({
    required this.pendingCount,
    required this.onTap,
  });

  @override
  State<_MiniPendingSignatoriesBannerCard> createState() =>
      _MiniPendingSignatoriesBannerCardState();
}

class _MiniPendingSignatoriesBannerCardState
    extends State<_MiniPendingSignatoriesBannerCard> {
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
    final accentOrange = HexColor('EE7D13');
    final lightOrange = HexColor('FFF4E6');
    final fadedGreen = HexColor(AppColors.fadedGreen);
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
                lightOrange,
                lightOrange.withValues(alpha: 0.6),
                Colors.white,
              ],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: accentOrange.withValues(alpha: 0.3),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: accentOrange.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon container with badge
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [accentOrange, accentOrange.withValues(alpha: 0.8)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: accentOrange.withValues(alpha: 0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: HugeIcon(
                        icon: HugeIcons.strokeRoundedCheckList,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                  // Badge count
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Text(
                        widget.pendingCount > 9 ? '9+' : '${widget.pendingCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pending Approvals',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: accentOrange,
                        height: 1.1,
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.clip,
                    ),
                    Text(
                      '${widget.pendingCount} ${widget.pendingCount == 1 ? 'request' : 'requests'} awaiting your action',
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
                  color: accentOrange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: accentOrange.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Review',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: accentOrange,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios, color: accentOrange, size: 10),
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

