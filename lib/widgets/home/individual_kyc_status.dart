import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../widget.dart';

class IndividualKycStatus extends StatelessWidget {
  const IndividualKycStatus({super.key});

  // Returns gradient colors based on KYC status
  List<Color> _gradientColors(ProfileProvider profile) {
    final lightFadedGreen = HexColor(AppColors.lightFadedGreen);
    final orange = HexColor(AppColors.primaryOrange);
    final red = HexColor(AppColors.red);

    if (profile.user?.kycStatus == Strings.kycRejected) {
      return [red.withValues(alpha: 0.08), Colors.white];
    }
    if (profile.user?.profileImg == null) {
      return [lightFadedGreen, lightFadedGreen.withValues(alpha: 0.5), Colors.white];
    }
    if (profile.user?.kycStatus == Strings.kycPending) {
      return [orange.withValues(alpha: 0.08), Colors.white];
    }
    return [Colors.white, Colors.white];
  }

  Color _accentColor(ProfileProvider profile) {
    if (profile.user?.kycStatus == Strings.kycRejected) return HexColor(AppColors.red);
    if (profile.user?.kycStatus == Strings.kycPending) return HexColor(AppColors.primaryOrange);
    return HexColor(AppColors.primaryGreen);
  }

  IconData _icon(ProfileProvider profile) {
    if (profile.user?.kycStatus == Strings.kycRejected) return HugeIcons.strokeRoundedAlert02;
    if (profile.user?.profileImg == null) return HugeIcons.strokeRoundedCloudUpload;
    return HugeIcons.strokeRoundedLoading03;
  }

  String? _message(ProfileProvider profile) {
    if (profile.user?.profileImg == null) return 'Complete your KYC verification';
    if (profile.user?.kycStatus == Strings.kycPending) return 'KYC verification in progress';
    if (profile.user?.kycStatus == Strings.kycRejected) return 'KYC rejected - tap to retry';
    return null;
  }

  String _actionText(ProfileProvider profile) {
    if (profile.user?.profileImg == null) return 'Upload';
    if (profile.user?.kycStatus == Strings.kycRejected) return 'Retry';
    return 'View';
  }

  void _handleTap(BuildContext context, ProfileProvider profile) {
    if (profile.user?.profileImg == null || profile.user?.kycStatus == Strings.kycRejected) {
      Navigator.pushNamed(context, Routes.tukuIndividualKyc);
    } else if (profile.user?.profileImg != null && profile.user?.kycStatus == Strings.kycPending) {
      showGeneralDialog(
        context: context,
        pageBuilder: (_, __, ___) => const SizedBox(),
        transitionDuration: const Duration(milliseconds: 500),
        transitionBuilder: (context, anim1, anim2, child) => InfoAlert(anim1: anim1, isHome: true, isIndividual: true),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final fadedGreen = HexColor(AppColors.fadedGreen);
    final theme = Theme.of(context);

    return Consumer<ProfileProvider>(builder: (_, profile, __) {
      final msg = _message(profile);
      if (msg == null) return const SizedBox();

      final accent = _accentColor(profile);
      final gradients = _gradientColors(profile);
      final icon = _icon(profile);
      final actionText = _actionText(profile);

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
        child: GestureDetector(
          onTap: () => _handleTap(context, profile),
          child: Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradients,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: accent.withValues(alpha: 0.35),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                // Icon container
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: accent.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: HugeIcon(
                      icon: icon,
                      color: accent,
                      size: 20,
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
                        profile.user?.kycStatus == Strings.kycRejected
                            ? 'KYC Rejected'
                            : profile.user?.profileImg == null
                                ? 'KYC Required'
                                : 'Under Review',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: accent,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        msg,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: fadedGreen,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Action chip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: accent.withValues(alpha: 0.25),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        actionText,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: accent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios, color: accent, size: 10),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }
}
