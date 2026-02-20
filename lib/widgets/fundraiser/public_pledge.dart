import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../widget.dart';
import '../../models/models.dart';

/// Modern fintech-styled pledges list
/// Displays user's pledges to a fundraiser
class PublicPledge extends StatefulWidget {
  const PublicPledge({super.key});

  @override
  State<PublicPledge> createState() => _PublicPledgeState();
}

class _PublicPledgeState extends State<PublicPledge> {
  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        // Loading state
        if (fundraiserProvider.loadingPledges) {
          return _buildLoadingState();
        }

        // Empty state
        if (fundraiserProvider.pledgeForFundraiser.isEmpty) {
          return _buildEmptyState(fundraiserProvider);
        }

        // Pledges list
        return _buildPledgesList(fundraiserProvider);
      },
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: 3,
      itemBuilder: (context, index) {
        return _buildShimmerCard(index);
      },
    );
  }

  Widget _buildShimmerCard(int index) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: index % 2 == 0
              ? [Colors.white, HexColor('#FFF9F5')]
              : [Colors.white, HexColor('#F8FAF9')],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: HexColor('#E8ECE9'), width: 1),
      ),
      child: Row(
        children: [
          // Index badge with placeholder
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Icon placeholder with actual icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [HexColor('#E3F2FD'), HexColor('#BBDEFB')],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              HugeIcons.strokeRoundedHandPrayer,
              color: HexColor(AppColors.primaryGreen).withAlpha(80),
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 13,
                  width: 80,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                // Status chip placeholder
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: HexColor('#F0F4F3'),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Container(
                    width: 45,
                    height: 9,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                // Date placeholder
                Row(
                  children: [
                    Icon(
                      HugeIcons.strokeRoundedCalendar03,
                      size: 11,
                      color: HexColor(AppColors.darkerGray2).withAlpha(60),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      width: 30,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                height: 14,
                width: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 6),
              // Progress indicator placeholder
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: HexColor('#FFF3E0').withAlpha(150),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Container(
                  width: 35,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(FundraiserProvider fundraiserProvider) {
    final isOwner = Provider.of<ProfileProvider>(context, listen: false).user?.userId ==
        fundraiserProvider.selectedFundraiser?.ownerId;

    return Padding(
      padding: Paddings.mediumVertical,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [HexColor('#E3F2FD'), HexColor('#BBDEFB')],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              HugeIcons.strokeRoundedHandPrayer,
              color: HexColor(AppColors.primaryGreen),
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isOwner ? 'No Pledges Added' : 'No Pledges Yet',
            style: Blacks.regularBoldGrotesk.copyWith(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isOwner
                ? 'Pledges you add for contributors\nwill appear here'
                : 'A pledge you commit to this campaign\nwill appear here',
            style: Grays.tinyPoppinsHint,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPledgesList(FundraiserProvider fundraiserProvider) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: fundraiserProvider.pledgeForFundraiser.length,
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemBuilder: (context, index) {
        PledgeResponse pledge = fundraiserProvider.pledgeForFundraiser[index];
        return PublicPledgeCard(
          index: index,
          pledge: pledge,
        );
      },
    );
  }
}
