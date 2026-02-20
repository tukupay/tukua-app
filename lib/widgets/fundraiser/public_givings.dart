import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Modern fintech-styled givings/contributions list
/// Displays user's contributions to a fundraiser
class PublicGivings extends StatelessWidget {
  const PublicGivings({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        // Loading state
        if (fundraiserProvider.loadingContributions) {
          return _buildLoadingState();
        }

        // Empty state
        if (fundraiserProvider.contributions.isEmpty) {
          return _buildEmptyState();
        }

        // Contributions list
        return _buildContributionsList(fundraiserProvider);
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
        return PublicGivingShimmerCard(index: index);
      },
    );
  }

  Widget _buildEmptyState() {
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
                colors: [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              HugeIcons.strokeRoundedGift,
              color: HexColor(AppColors.primaryGreen),
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No Contributions Yet',
            style: Blacks.regularBoldGrotesk.copyWith(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Givings you contribute to this campaign\nwill appear here',
            style: Grays.tinyPoppinsHint,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContributionsList(FundraiserProvider fundraiserProvider) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: fundraiserProvider.contributions.length,
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemBuilder: (context, index) {
        ContributionResponse contribution = fundraiserProvider.contributions[index];
        return PublicGivingCard(
          index: index,
          contribution: contribution,
        );
      },
    );
  }
}
