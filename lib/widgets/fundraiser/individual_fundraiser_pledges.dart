import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class IndividualFundraiserPledges extends StatelessWidget {
  final int length;
  const IndividualFundraiserPledges({
    super.key,
    required this.length,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        final pledges = fundraiserProvider.campaignAnalytics!.recentPledges!;

        if (pledges.isEmpty) {
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
                      HugeIcons.strokeRoundedHandPrayer,
                      size: 48,
                      color: HexColor(AppColors.primaryGreen).withAlpha(150),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "No pledges yet",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Pledges will appear here\nonce made!",
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
                        color: HexColor(AppColors.primaryGreen).withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedHandPrayer,
                        size: 14,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Recent Pledges",
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
                        "${pledges.length} total",
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
              // Pledge cards
              ...pledges.take(length).toList().asMap().entries.map(
                (entry) => _buildPledgeCard(entry.key, entry.value),
              ),
              const SizedBox(height: 16),
              // Summary card
              const PledgesSummary(),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPledgeCard(int index, pledge) {
    final percentPaid = pledge.amount! > 0
        ? ((pledge.amountPaid ?? 0) / pledge.amount! * 100).clamp(0, 100)
        : 0.0;

    // Alternate gradient colors - same as contributions
    final isEven = index % 2 == 0;
    final gradientColors = isEven
        ? [Colors.white, HexColor('#F9FBF9')]
        : [Colors.white, HexColor('#FFFBF8')];

    // Avatar gradient based on index - same as contributions
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
                    (pledge.pledgerName ?? 'U').substring(0, 1).toUpperCase(),
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
                      pledge.pledgerName ?? 'Anonymous',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    _buildInfoChip(
                      icon: HugeIcons.strokeRoundedHandPrayer,
                      text: '${percentPaid.toInt()}% fulfilled',
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
                      'KES ${formatThousands(amount: pledge.amount, noDecimal: true)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Paid: KES ${formatThousands(amount: pledge.amountPaid, noDecimal: true)}',
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
}
