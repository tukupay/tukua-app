import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../widget.dart';

class FundraiserTransactions extends StatelessWidget {
  const FundraiserTransactions({super.key});

  Widget _buildLoadingSkeleton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        border: Border.all(color: HexColor(AppColors.lightestGray)),
        boxShadow: [
          BoxShadow(
            offset: const Offset(0, 2),
            blurRadius: 12,
            spreadRadius: 0,
            color: Colors.black.withAlpha(15),
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header skeleton
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen).withAlpha(15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedInvoice03,
                        size: 18,
                        color: HexColor(AppColors.primaryGreen).withAlpha(100),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Shimmer.fromColors(
                      baseColor: Colors.grey[300]!,
                      highlightColor: Colors.grey[100]!,
                      child: Container(
                        height: 16,
                        width: 100,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ],
                ),
                Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Container(
                      width: 50,
                      height: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Divider
          Container(
            color: HexColor(AppColors.lightestGray),
            height: 1,
          ),
          // Tab skeleton
          Padding(
            padding: const EdgeInsets.all(12),
            child: Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: HexColor(AppColors.lightestGray).withAlpha(100),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          // List items skeleton
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: List.generate(3, (index) => _buildTransactionItemSkeleton(index)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildTransactionItemSkeleton(int index) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: HexColor(AppColors.lightestGray)),
        ),
        child: Row(
          children: [
            // Avatar skeleton with icon
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen).withAlpha(30),
                    HexColor(AppColors.brightGreen).withAlpha(20),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                HugeIcons.strokeRoundedUser,
                size: 18,
                color: HexColor(AppColors.primaryGreen).withAlpha(60),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 13,
                    width: 90,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 10,
                    width: 60,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  height: 14,
                  width: 65,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 10,
                  width: 45,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
        builder: (_, fundraiserProvider, __) {
          return fundraiserProvider.loadingAnalytics
              ? _buildLoadingSkeleton()
              : Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.white,
                    border: Border.all(color: HexColor(AppColors.lightestGray)),
                    boxShadow: [
                      BoxShadow(
                        offset: const Offset(0, 2),
                        blurRadius: 12,
                        spreadRadius: 0,
                        color: Colors.black.withAlpha(15),
                      )
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: HexColor(AppColors.primaryGreen).withAlpha(15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    HugeIcons.strokeRoundedInvoice03,
                                    size: 18,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                const Text(
                                  'Transactions',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.pushNamed(
                                    context, Routes.allFundraiserTransactions);
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(12),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'View All',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: HexColor(AppColors.primaryGreen),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      HugeIcons.strokeRoundedArrowRight01,
                                      size: 14,
                                      color: HexColor(AppColors.primaryGreen),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Divider
                      Container(
                        color: HexColor(AppColors.lightestGray),
                        height: 1,
                      ),
                      // Tab content
                      fundraiserProvider.campaignAnalytics == null
                          ? const SizedBox(height: 100)
                          : DefaultTabController(
                              length: 2,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Modern Tab Bar
                                  Container(
                                    margin: const EdgeInsets.all(12),
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: HexColor(AppColors.lightestGray).withAlpha(100),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: TabBar(
                                      dividerColor: Colors.transparent,
                                      indicator: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withAlpha(10),
                                            blurRadius: 4,
                                            offset: const Offset(0, 1),
                                          ),
                                        ],
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
                                      tabs: [
                                        Tab(
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(HugeIcons.strokeRoundedHandPrayer, size: 16),
                                              const SizedBox(width: 6),
                                              const Text('Pledges'),
                                            ],
                                          ),
                                        ),
                                        Tab(
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(HugeIcons.strokeRoundedMoneySend01, size: 16),
                                              const SizedBox(width: 6),
                                              const Text('Contributions'),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Tab content with auto height
                                  SizedBox(
                                    height: 400,
                                    child: TabBarView(
                                      physics: const NeverScrollableScrollPhysics(),
                                      children: [
                                        IndividualFundraiserPledges(length: 3),
                                        IndividualFundraiserContributions(length: 3),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ],
                  ),
                );
        });
  }
}
