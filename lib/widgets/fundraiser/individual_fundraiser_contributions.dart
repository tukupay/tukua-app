import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
import '../../providers/providers.dart';

class IndividualFundraiserContributions extends StatelessWidget {
  final int length;
  const IndividualFundraiserContributions({
    super.key,
    required this.length,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer2<FundraiserProvider, PaymentsProvider>(
      builder: (_, fundraiserProvider, payments, __) {
        final contributions = fundraiserProvider.campaignAnalytics!.recentContributions!;

        if (contributions.isEmpty) {
          return Center(
            child: Container(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen).withAlpha(15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      HugeIcons.strokeRoundedGift,
                      size: 48,
                      color: HexColor(AppColors.primaryGreen).withAlpha(150),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "No contributions yet",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Be the first to contribute and\nmake a difference!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: HexColor(AppColors.darkerGray2),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section header
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.brightGreen).withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedUserMultiple,
                        size: 14,
                        color: HexColor(AppColors.brightGreen),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Recent Contributors",
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.lightestGray),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        "${contributions.length} total",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Contribution cards
              ...contributions.take(length).toList().asMap().entries.map(
                (entry) => _buildContributionCard(entry.key, entry.value, payments),
              ),
              const SizedBox(height: 16),
              // Summary card
              const ContributionsSummary(),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContributionCard(int index, contribution, PaymentsProvider payments) {
    String paymentMethod = 'Direct';
    try {
      paymentMethod = payments.paymentMethods
          .firstWhere((el) => el.method == contribution.transferType)
          .name;
    } catch (_) {}

    // Alternate gradient colors
    final isEven = index % 2 == 0;
    final gradientColors = isEven
        ? [Colors.white, HexColor('#F9FBF9')]
        : [Colors.white, HexColor('#FFFBF8')];

    // Avatar gradient based on index
    final avatarColors = [
      [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
      [HexColor('#FFF3E0'), HexColor('#FFE0B2')],
      [HexColor('#E3F2FD'), HexColor('#BBDEFB')],
      [HexColor('#F3E5F5'), HexColor('#E1BEE7')],
    ];
    final avatarColorPair = avatarColors[index % avatarColors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HexColor('#E8ECE9')),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Rank badge
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(20),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: avatarColorPair,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: avatarColorPair[1].withAlpha(80),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    (contribution.contributorName ?? 'U').substring(0, 1).toUpperCase(),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      contribution.contributorName ?? 'Anonymous',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildInfoChip(
                          icon: _getMethodIcon(paymentMethod),
                          text: paymentMethod,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Amount column
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.lightestGray),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: HexColor(AppColors.lightGray).withAlpha(60),
                      ),
                    ),
                    child: Text(
                      'KES ${formatThousands(amount: contribution.amount, noDecimal: true)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedCalendar03,
                        size: 10,
                        color: HexColor(AppColors.darkerGray2),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        formatDate(contribution.contributedAt!),
                        style: TextStyle(
                          fontSize: 10,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip({required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: HexColor('#F5F7F6'),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 11,
            color: HexColor(AppColors.darkerGray2),
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: HexColor(AppColors.darkerGray2),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getMethodIcon(String method) {
    switch (method.toLowerCase()) {
      case 'mpesa':
      case 'm-pesa':
        return HugeIcons.strokeRoundedSmartPhone01;
      case 'wallet':
      case 'tuku':
        return HugeIcons.strokeRoundedWallet01;
      case 'bank':
        return HugeIcons.strokeRoundedBank;
      case 'card':
        return HugeIcons.strokeRoundedCreditCard;
      default:
        return HugeIcons.strokeRoundedPayment01;
    }
  }
}
