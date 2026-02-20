import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
import '../../providers/providers.dart';

class Fundraiser extends StatefulWidget {
  const Fundraiser({super.key});

  @override
  State<Fundraiser> createState() => _FundraiserState();
}

class _FundraiserState extends State<Fundraiser> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await Provider
          .of<FundraiserProvider>(context, listen: false)
          .getCategories();
      if (!mounted) return;
      await Provider
          .of<FundraiserProvider>(context, listen: false)
          .getActiveFundraisers();
      await Provider.of<FundraiserProvider>(context,listen: false)
          .getInactiveFundraisers();
      await Provider.of<FundraiserProvider>(context,listen: false)
          .getCancelledFundraisers();
      await Provider.of<FundraiserProvider>(context,listen: false)
          .getCompletedFundraisers();

      if (!mounted) return;
      await Provider
          .of<FundraiserProvider>(context, listen: false)
          .getMyPledges();
      if (!mounted) return;
      await Provider
          .of<FundraiserProvider>(context, listen: false)
          .getAllFundraisers();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery
        .of(context)
        .size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: AssetImage(Strings.imageAsset('bg.png')),
            fit: BoxFit.cover,
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: AssetImage(Strings.imageAsset('gradient2.png')),
              fit: BoxFit.cover,
            ),
          ),
          child: Column(
            children: [
              // Custom App Bar
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(10),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                              color: HexColor(AppColors.darkerGray2), size: 20),
                        ),
                      ),
                      const Spacer(),
                      Column(
                        children: [
                          Text('Fundraisers', style: Blacks.mediumSemiRubik),
                          const SizedBox(height: 2),
                          Text('Support causes that matter',
                              style: Grays.smallestPoppinsHint.copyWith(
                                  fontSize: 10)),
                        ],
                      ),
                      const Spacer(),
                      // Create button in header
                      GestureDetector(
                        onTap: () =>
                            Navigator.pushNamed(
                                context, Routes.createFundraiser),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14,
                              vertical: 10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                HexColor(AppColors.primaryGreen),
                                HexColor(AppColors.fadedGreen),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: HexColor(AppColors.primaryGreen)
                                    .withAlpha(51),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(HugeIcons.strokeRoundedAdd01,
                                  color: Colors.white, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                'Create',
                                style: Whites.smallBoldRoboto.copyWith(
                                    fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Modern Tab Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(10),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TabBar(
                    controller: _tabController,
                    dividerColor: Colors.transparent,
                    indicator: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          HexColor(AppColors.primaryGreen),
                          HexColor(AppColors.fadedGreen),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: HexColor(AppColors.primaryGreen).withAlpha(51),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: HexColor(AppColors.darkerGray2),
                    labelStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    unselectedLabelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: HexColor(AppColors.darkerGray2),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    tabs: [
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(HugeIcons.strokeRoundedMoneySavingJar,
                                size: 16),
                            const SizedBox(width: 6),
                            const Text('Mine'),
                          ],
                        ),
                      ),
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
                            Icon(HugeIcons.strokeRoundedSearch01, size: 16),
                            const SizedBox(width: 6),
                            const Text('Discover'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    ActiveFundraisers(),
                    MyPledges(),
                    SearchFundraisers(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

