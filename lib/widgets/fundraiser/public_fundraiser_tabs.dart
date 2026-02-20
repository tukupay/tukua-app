import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';

/// Modern fintech-styled tabs for public fundraiser givings & pledges
class PublicFundraiserTabs extends StatelessWidget {
  const PublicFundraiserTabs({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<FundraiserProvider, ProfileProvider>(
      builder: (_, fundraiserProvider, profile, __) {
        final isOwner = fundraiserProvider.selectedFundraiser?.ownerId == profile.user?.userId;

        return DefaultTabController(
          length: 2,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Tab bar
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(
                    color: HexColor(AppColors.lightestGray),
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(8),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TabBar(
                  dividerColor: Colors.transparent,
                  indicator: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        HexColor(AppColors.primaryGreen).withAlpha(20),
                        HexColor(AppColors.brightGreen).withAlpha(20),
                      ],
                    ),
                    border: Border.all(
                      color: HexColor(AppColors.primaryGreen),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  labelColor: HexColor(AppColors.primaryGreen),
                  unselectedLabelColor: HexColor(AppColors.darkerGray2),
                  labelStyle: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicatorPadding: const EdgeInsets.all(4),
                  tabs: [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedGift,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          const Text('Your Givings'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedHandPrayer,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(isOwner ? 'Added Pledges' : 'Your Pledges'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Tab content - flexible height based on content
              SizedBox(
                height: 400,
                child: TabBarView(
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    PublicGivings(),
                    PublicPledge(),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
