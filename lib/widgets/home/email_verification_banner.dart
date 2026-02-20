import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../providers/providers.dart';
import '../../constants/constants.dart';

/// EmailVerificationBanner
/// Shown when user has an email but it's not verified
class EmailVerificationBanner extends StatelessWidget {
  const EmailVerificationBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (_, profile, __) {
        final user = profile.user;
        final hasEmail = user?.email != null && user!.email!.isNotEmpty;
        final isVerified = user?.emailVerified == true;

        // Only show if user has email but it's not verified
        if (!hasEmail || isVerified) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
          child: _EmailBannerCard(email: user.email!),
        );
      },
    );
  }
}

class _EmailBannerCard extends StatefulWidget {
  final String email;
  const _EmailBannerCard({required this.email});

  @override
  State<_EmailBannerCard> createState() => _EmailBannerCardState();
}

class _EmailBannerCardState extends State<_EmailBannerCard> {
  bool _pressed = false;

  void _down(TapDownDetails _) => setState(() => _pressed = true);
  void _cancel() => setState(() => _pressed = false);

  Future<void> _handleVerify() async {
    setState(() {
      _pressed = false;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.sendEmailOTP();

    if (mounted) {
      if (auth.authError == null) {
        Navigator.pushNamed(context, Routes.verifyEmail);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryGreen = HexColor(AppColors.primaryGreen);
    final fadedGreen = HexColor(AppColors.fadedGreen);
    final brightGreen = HexColor(AppColors.brightGreen);
    final lightFadedGreen = HexColor(AppColors.lightFadedGreen);
    final theme = Theme.of(context);

    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        return GestureDetector(
          onTapDown: _down,
          onTapCancel: _cancel,
          onTapUp: (_) => _handleVerify(),
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
                    lightFadedGreen.withValues(alpha: 0.4),
                    Colors.white.withValues(alpha: 0.9),
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: fadedGreen.withValues(alpha: 0.25),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: primaryGreen.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Icon container with gradient ring
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          fadedGreen.withValues(alpha: 0.15),
                          brightGreen.withValues(alpha: 0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: fadedGreen.withValues(alpha: 0.3),
                        width: 1.2,
                      ),
                    ),
                    child: Center(
                      child: HugeIcon(
                        icon: HugeIcons.strokeRoundedMail01,
                        color: primaryGreen,
                        size: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Verify your email',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: primaryGreen,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.clip,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _maskEmail(widget.email),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: fadedGreen,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.clip,
                        ),
                      ],
                    ),
                  ),
                  // Verify button
                  auth.resendingOTP
                      ? Container(
                          width: 64,
                          height: 28,
                          decoration: BoxDecoration(
                            color: brightGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: primaryGreen,
                              ),
                            ),
                          ),
                        )
                      : Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [primaryGreen, fadedGreen],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: primaryGreen.withValues(alpha: 0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            'Verify',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Masks email for privacy display (e.g. jo***@gmail.com)
  String _maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;

    final local = parts[0];
    final domain = parts[1];

    if (local.length <= 2) {
      return '$local***@$domain';
    }

    return '${local.substring(0, 2)}***@$domain';
  }
}




