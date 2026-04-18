import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../../constants/constants.dart';

class IndividualWalletActivation extends StatelessWidget {
  const IndividualWalletActivation({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(height: size.height / 16),

          // Success badge
          Container(
            height: 96,
            width: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  HexColor(AppColors.primaryGreen),
                  HexColor(AppColors.fadedGreen),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: HexColor(AppColors.primaryGreen).withAlpha(50),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(
              HugeIcons.strokeRoundedWallet03,
              size: 42,
              color: Colors.white,
            ),
          ),
          Spaces.mediumTopSpace,

          Text('Wallet Created!',
              style: Blacks.mediumSemiPoppins),
          const SizedBox(height: 6),
          Padding(
            padding: Paddings.mediumHorizontal,
            child: Text(
              'Your wallet has been successfully created. '
              'Activate it to start transacting.',
              style: Grays.tinyPoppinsHint,
              textAlign: TextAlign.center,
            ),
          ),
          Spaces.mediumTopSpace,

          // Status card
          Container(
            width: size.width,
            padding: const EdgeInsets.all(20),
            decoration: GlassMorphism.greenTinted(borderRadius: 18),
            child: Column(
              children: [
                _StatusRow(
                  icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                  label: 'KYC Submitted',
                  status: 'Complete',
                  statusColor: AppColors.brightGreen,
                ),
                Divider(height: 1, color: Colors.black.withAlpha(15)),
                _StatusRow(
                  icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                  label: 'OTP Verified',
                  status: 'Complete',
                  statusColor: AppColors.brightGreen,
                ),
                Divider(height: 1, color: Colors.black.withAlpha(15)),
                _StatusRow(
                  icon: HugeIcons.strokeRoundedWallet03,
                  label: 'Wallet Created',
                  status: 'Complete',
                  statusColor: AppColors.brightGreen,
                ),
                Divider(height: 1, color: Colors.black.withAlpha(15)),
                _StatusRow(
                  icon: HugeIcons.strokeRoundedFingerAccess,
                  label: 'Identity Verification',
                  status: 'Pending',
                  statusColor: AppColors.primaryOrange,
                ),
              ],
            ),
          ),

          Spaces.smallTopSpace,

          // Info tip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: HexColor(AppColors.lightFadedGreen).withAlpha(140),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: HexColor(AppColors.primaryGreen).withAlpha(30),
              ),
            ),
            child: Row(
              children: [
                Icon(HugeIcons.strokeRoundedShield01,
                    size: 18,
                    color: HexColor(AppColors.fadedGreen)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Activating sends your KYC documents to SasaPay for final identity verification.',
                    style: Grays.smallestPoppinsHint,
                  ),
                ),
              ],
            ),
          ),
          Spaces.mediumTopSpace,
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String status;
  final String statusColor;

  const _StatusRow({
    required this.icon,
    required this.label,
    required this.status,
    required this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: HexColor(statusColor)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label, style: Blacks.smallestBolderPoppins),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: HexColor(statusColor).withAlpha(22),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(status,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: HexColor(statusColor),
                )),
          ),
        ],
      ),
    );
  }
}
