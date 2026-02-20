import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';

class SearchFundraisers extends StatefulWidget {
  const SearchFundraisers({super.key});

  @override
  State<SearchFundraisers> createState() => _SearchFundraisersState();
}

class _SearchFundraisersState extends State<SearchFundraisers> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
   WidgetsBinding.instance.addPostFrameCallback((_){
     final provider = Provider.of<FundraiserProvider>(context, listen: false);
     if (provider.allFundraisers.isEmpty) {
       provider.getAllFundraisers(isRefresh: true);
     }
     _scrollController.addListener(_onScroll);
   });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      Provider.of<FundraiserProvider>(context, listen: false).getAllFundraisers();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<FundraiserProvider>(context, listen: false)
        .getAllFundraisers(isRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Bar
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(10),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search fundraisers...',
                    hintStyle: Grays.tinyPoppinsHint.copyWith(fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    prefixIcon: Icon(
                      HugeIcons.strokeRoundedSearch01,
                      color: HexColor(AppColors.darkerGray2),
                      size: 20,
                    ),
                    suffixIcon: Container(
                      margin: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: HexColor('#F0F4F3'),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedPreferenceHorizontal,
                        color: HexColor(AppColors.darkerGray2),
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Stats Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: HexColor('#E8F5E9'),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedGlobe02,
                          size: 14,
                          color: HexColor(AppColors.primaryGreen),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${fundraiserProvider.allFundraisers.length} Active',
                          style: TextStyle(
                            color: HexColor(AppColors.primaryGreen),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Pull to refresh',
                    style: Grays.smallestPoppinsHint.copyWith(fontSize: 11),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    HugeIcons.strokeRoundedRefresh,
                    size: 12,
                    color: HexColor(AppColors.darkerGray2).withAlpha(128),
                  ),
                ],
              ),

              // Fundraisers List
              Expanded(
                child: fundraiserProvider.loadingAllFundraisers &&
                       fundraiserProvider.allFundraisers.isEmpty
                    ? ListView.separated(
                  padding: Paddings.smallVertical,
                        itemCount: 5,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, __) => const LoadingFundraiserCard(),
                      )
                    : fundraiserProvider.allFundraisers.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _onRefresh,
                            color: HexColor(AppColors.primaryGreen),
                            child: ListView.separated(
                              padding: Paddings.smallVertical,
                              controller: _scrollController,
                              itemCount: fundraiserProvider.allFundraisers.length +
                                  (fundraiserProvider.loadingMoreAllFundraisers ? 1 : 0),
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                if (index == fundraiserProvider.allFundraisers.length) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(
                                            HexColor(AppColors.primaryGreen),
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }
                                FundraiserResponse fundraiser =
                                    fundraiserProvider.allFundraisers[index];
                                return ExploreFundraiserCard(
                                  index: index,
                                  fundraiser: fundraiser,
                                );
                              },
                            ),
                          ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: HexColor(AppColors.primaryGreen),
      child: Stack(
        children: [
          ListView(), // Empty list for RefreshIndicator
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: HexColor('#F0F4F3'),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedSearch01,
                    size: 56,
                    color: HexColor(AppColors.darkerGray2).withAlpha(128),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'No fundraisers found',
                  style: Blacks.regularBoldCodeNext.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  'Check back later for new campaigns',
                  style: Grays.smallestPoppinsHint.copyWith(fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
