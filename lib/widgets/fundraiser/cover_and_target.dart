import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';

import '../../constants/constants.dart';
import '../widget.dart';

class CoverAndTarget extends StatelessWidget {
  final bool? isPublic;
  const CoverAndTarget({super.key, this.isPublic = false});

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        final fundraiser = fundraiserProvider.selectedFundraiser!;
        final progress = (fundraiser.amountRaised! / fundraiser.goalAmount! * 100).clamp(0, 100);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Payment Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen).withAlpha(15),
                    HexColor(AppColors.brightGreen).withAlpha(8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: HexColor(AppColors.primaryGreen).withAlpha(30),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedCreditCard,
                        size: 18,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Payment Details',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildPaymentInfoChip(
                        icon: HugeIcons.strokeRoundedSmartPhone04,
                        label: 'Paybill',
                        value: '400200',
                      ),
                      const SizedBox(width: 12),
                      _buildPaymentInfoChip(
                        icon: HugeIcons.strokeRoundedNote,
                        label: 'Acc No',
                        value: '47938990',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Progress section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: HexColor(AppColors.lightestGray).withAlpha(80),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HexColor(AppColors.lightestGray)),
              ),
              child: Column(
                children: [
                  // Progress header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Collection Progress',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryGreen).withAlpha(20),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${progress.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: HexColor(AppColors.primaryGreen),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress bar
                  Container(
                    height: 10,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.lightestGray),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: (progress / 100).clamp(0.0, 1.0),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              HexColor(AppColors.primaryGreen),
                              HexColor(AppColors.brightGreen),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(5),
                          boxShadow: [
                            BoxShadow(
                              color: HexColor(AppColors.primaryGreen).withAlpha(60),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Stats row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildProgressStat(
                        icon: HugeIcons.strokeRoundedInboxDownload,
                        iconColor: HexColor(AppColors.primaryGreen),
                        label: 'Collected',
                        value: formatThousands(amount: fundraiser.amountRaised!.toDouble(), noDecimal: true),
                      ),
                      Container(
                        width: 1,
                        height: 40,
                        color: HexColor(AppColors.lightGray),
                      ),
                      _buildProgressStat(
                        icon: HugeIcons.strokeRoundedTarget02,
                        iconColor: HexColor(AppColors.brightGreen),
                        label: 'Target',
                        value: formatThousands(amount: fundraiser.goalAmount!.toDouble(), noDecimal: true),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // View all images button
            if (fundraiser.otherImageUrls != null && fundraiser.otherImageUrls!.isNotEmpty) ...[
              const SizedBox(height: 12),
              ViewAllImagesButton(imageUrls: fundraiser.otherImageUrls!),
            ],
          ],
        );
      },
    );
  }

  Widget _buildPaymentInfoChip({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: HexColor(AppColors.lightGray).withAlpha(100)),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: HexColor(AppColors.primaryGreen),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressStat({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withAlpha(20),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
            Text(
              'KES $value',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
