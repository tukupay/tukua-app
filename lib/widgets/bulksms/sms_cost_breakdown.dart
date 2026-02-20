import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../widget.dart';

/// Cost breakdown card showing SMS pricing details
class SmsCostBreakdown extends StatelessWidget {
  const SmsCostBreakdown({super.key, required this.creditPricing});

  final CreditTierPricing creditPricing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(100),
        border: Border.all(color: HexColor(AppColors.lightGray)),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#FFF3E0'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedInvoice02,
                  size: 18,
                  color: HexColor(AppColors.primaryOrange),
                ),
              ),
              const SizedBox(width: 12),
              Text('Cost Breakdown', style: Blacks.tinyBolderPoppins),
            ],
          ),
          const SizedBox(height: 16),
          // Divider
          Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  HexColor(AppColors.primaryGreen).withAlpha(0),
                  HexColor(AppColors.primaryGreen),
                  HexColor(AppColors.primaryGreen).withAlpha(0),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Breakdown items
          _CostItem(
            icon: HugeIcons.strokeRoundedMail01,
            label: 'SMS Count',
            value: '${formatThousands(
              amount: creditPricing.smsCount?.toDouble() ?? 0,
              noDecimal: true,
            )} SMS',
            iconColor: HexColor(AppColors.primaryGreen),
          ),
          const SizedBox(height: 12),
          _CostItem(
            icon: HugeIcons.strokeRoundedMoneyBag02,
            label: 'Price Per SMS',
            value: 'Ksh. ${creditPricing.sellingPricePerSms}',
            iconColor: HexColor(AppColors.fadedGreen),
          ),
          const SizedBox(height: 16),
          // Divider
          Container(
            height: 1,
            color: HexColor(AppColors.lightGray),
          ),
          const SizedBox(height: 16),
          // Total
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  HexColor(AppColors.primaryGreen).withAlpha(15),
                  HexColor(AppColors.fadedGreen).withAlpha(15),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: HexColor(AppColors.primaryGreen).withAlpha(51),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedCoins01,
                    size: 20,
                    color: HexColor(AppColors.primaryGreen),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Cost',
                      style: Grays.tinySemiGrotesk.copyWith(fontSize: 11),
                    ),
                    Text(
                      'Ksh. ${formatThousands(
                        amount: creditPricing.amount ?? 0,
                        noDecimal: true,
                      )}',
                      style: Blacks.regularBoldCodeNext.copyWith(
                        fontSize: 18,
                        color: HexColor(AppColors.primaryGreen),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Individual cost item row
class _CostItem extends StatelessWidget {
  const _CostItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.iconColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: iconColor.withAlpha(25),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 14, color: iconColor),
        ),
        const SizedBox(width: 12),
        Text(label, style: Grays.tinySemiGrotesk),
        const Spacer(),
        Text(
          value,
          style: Blacks.tinyBolderPoppins,
        ),
      ],
    );
  }
}

