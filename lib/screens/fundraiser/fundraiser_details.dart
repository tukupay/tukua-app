import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:readmore/readmore.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../widgets/widget.dart';

class FundraiserDetails extends StatefulWidget {
  const FundraiserDetails({super.key});

  @override
  State<FundraiserDetails> createState() => _FundraiserDetailsState();
}

class _FundraiserDetailsState extends State<FundraiserDetails> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Provider.of<FundraiserProvider>(context, listen: false).getCampaignAnalytics();
    });
  }

  @override
  Widget build(BuildContext context) {

    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<FundraiserProvider>(context, listen: false).resetFundraiser();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Consumer<FundraiserProvider>(
          builder: (_, fundraiserProvider, __) {
            if (fundraiserProvider.selectedFundraiser == null) {
              return const SizedBox();
            }

            final fundraiser = fundraiserProvider.selectedFundraiser!;

            return CustomScrollView(
              slivers: [
                // Hero App Bar with image
                SliverAppBar(
                  expandedHeight: 280,
                  pinned: true,
                  backgroundColor: HexColor(AppColors.primaryGreen),
                  title: LayoutBuilder(
                    builder: (context, constraints) {
                      return AnimatedOpacity(
                        opacity: constraints.maxHeight <= kToolbarHeight + 30 ? 1.0 : 0.0,
                        duration: const Duration(milliseconds: 200),
                        child: Text(
                          fundraiser.title ?? 'Fundraiser',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    },
                  ),
                  leading: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(230),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(30),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: HexColor(AppColors.primaryGreen),
                        size: 18,
                      ),
                    ),
                  ),
                  actions: [
                    Container(
                      alignment: Alignment.center,
                      padding: Paddings.tinyAllSides,
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(230),
                        shape: BoxShape.circle,
                      ),
                      child: const NotificationsBell(),
                    ),
                    const SizedBox(width: 8),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Background image
                        fundraiser.coverPhotoUrl != null
                            ? Image.network(
                                fundraiser.coverPhotoUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Image.asset(
                                  Strings.sampleImageAsset('donate.jpg'),
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Image.asset(
                                Strings.sampleImageAsset('donate.jpg'),
                                fit: BoxFit.cover,
                              ),
                        // Gradient overlay
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withAlpha(180),
                              ],
                            ),
                          ),
                        ),
                        // Status badge
                        Positioned(
                          top: 100,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getStatusColor(fundraiser.status),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _getStatusIcon(fundraiser.status),
                                  size: 14,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  fundraiser.status?.toUpperCase() ?? 'ACTIVE',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Bottom wallet balance card
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: ClipRRect(
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                decoration: BoxDecoration(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(200),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Wallet Balance',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.white.withAlpha(200),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'KES ${formatThousands(amount: fundraiser.amountRaised!, noDecimal: true)}',
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ],
                                    ),
                                    GestureDetector(
                                      onTap: () async {
                                        await Share.share(
                                          "Have a look at this fundraiser ${fundraiser.publicUrl}",
                                          subject: 'I found something in the Tuku App.',
                                        );
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withAlpha(40),
                                          borderRadius: BorderRadius.circular(25),
                                          border: Border.all(color: Colors.white.withAlpha(60)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(
                                              HugeIcons.strokeRoundedShare08,
                                              color: Colors.white,
                                              size: 18,
                                            ),
                                            const SizedBox(width: 6),
                                            const Text(
                                              'Share',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Content
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title and category
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    fundraiser.title!,
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black87,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: HexColor(AppColors.primaryGreen).withAlpha(15),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.verified,
                                          size: 14,
                                          color: HexColor(AppColors.primaryGreen),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          fundraiser.category!,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: HexColor(AppColors.primaryGreen),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryGreen).withAlpha(15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                HugeIcons.strokeRoundedHealtcare,
                                color: HexColor(AppColors.primaryGreen),
                                size: 28,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Progress section
                        CoverAndTarget(),
                        const SizedBox(height: 24),
                        // Description
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: HexColor(AppColors.lightestGray).withAlpha(100),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: HexColor(AppColors.lightestGray)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    HugeIcons.strokeRoundedTextFirstlineLeft,
                                    size: 18,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'About this fundraiser',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ReadMoreText(
                                fundraiser.description!,
                                trimLines: 4,
                                trimMode: TrimMode.Line,
                                trimExpandedText: '  Show less',
                                trimCollapsedText: '  Read more',
                                moreStyle: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: HexColor(AppColors.primaryGreen),
                                ),
                                lessStyle: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: HexColor(AppColors.primaryGreen),
                                ),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: HexColor(AppColors.darkerGray2),
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Actions
                        FundraiserActions(),
                        const SizedBox(height: 24),
                        // Transactions
                        FundraiserTransactions(),
                        // Bottom padding for persistent action bar
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: Consumer<FundraiserProvider>(
          builder: (_, fundraiserProvider, __) {
            return GestureDetector(
              onTap: () async {
                if (fundraiserProvider.selectedFundraiser?.analyticsUrl != null) {
                  await Share.share(
                    "Here is my fundraiser's progress ${fundraiserProvider.selectedFundraiser!.analyticsUrl}",
                    subject: 'My Tuku Pay Fundraiser.',
                  );
                } else {
                  Fluttertoast.cancel();
                  Fluttertoast.showToast(msg: "Public analytics has been disabled for this fundraiser");
                }
              },
              child: Container(
                height: 60,
                width: 60,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      HexColor(fundraiserProvider.selectedFundraiser?.analyticsUrl == null
                          ? AppColors.lightGray
                          : AppColors.primaryGreen),
                      HexColor(fundraiserProvider.selectedFundraiser?.analyticsUrl == null
                          ? AppColors.darkerGray
                          : AppColors.brightGreen),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: HexColor(AppColors.primaryGreen).withAlpha(60),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  HugeIcons.strokeRoundedWhatsapp,
                  size: 30,
                  color: Colors.white,
                ),
              ),
            );
          },
        ),
        bottomNavigationBar: Consumer<FundraiserProvider>(
          builder: (_, fundraiserProvider, __) {
            if (fundraiserProvider.selectedFundraiser == null) {
              return const SizedBox();
            }
            final fundraiser = fundraiserProvider.selectedFundraiser!;
            final isActive = fundraiser.status?.toLowerCase() == 'active';

            return Container(
              padding: EdgeInsets.fromLTRB(
                20,
                16,
                20,
                MediaQuery.of(context).padding.bottom + 16,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(15),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Update/Edit Button
                  Expanded(
                    child: GestureDetector(
                      onTap: isActive
                          ? () => Navigator.pushNamed(context, Routes.editFundraiser)
                          : () {
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(
                                msg: 'Only active fundraisers can be updated',
                              );
                            },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: isActive
                              ? HexColor(AppColors.primaryGreen)
                              : HexColor(AppColors.lightGray),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: isActive
                              ? [
                                  BoxShadow(
                                    color: HexColor(AppColors.primaryGreen).withAlpha(50),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              HugeIcons.strokeRoundedEdit02,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Edit',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Activate/Deactivate Button
                  Expanded(
                    child: GestureDetector(
                      onTap: isActive
                          ? () => _showCancelDialog(fundraiserProvider)
                          : () => _showActivateDialog(fundraiserProvider),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.transparent : HexColor(AppColors.primaryGreen),
                          borderRadius: BorderRadius.circular(14),
                          border: isActive
                              ? Border.all(color: HexColor(AppColors.red), width: 1.5)
                              : null,
                          boxShadow: !isActive
                              ? [
                                  BoxShadow(
                                    color: HexColor(AppColors.primaryGreen).withAlpha(50),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isActive
                                  ? HugeIcons.strokeRoundedCancel01
                                  : HugeIcons.strokeRoundedActivity01,
                              color: isActive ? HexColor(AppColors.red) : Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isActive ? 'Cancel' : 'Activate',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isActive ? HexColor(AppColors.red) : Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _showActivateDialog(FundraiserProvider fundraiserProvider) {
    showAdaptiveDialog(
      context: context,
      builder: (context) => ConfirmAlert(
        text: "Activate Fundraiser?",
        pressed: () async {
          showAdaptiveDialog(
            context: context,
            builder: (context) => AiAnalysisAlert(
              icon: HugeIcons.strokeRoundedMoneySavingJar,
              action: 'Activating Fundraiser',
            ),
          );
          await Provider.of<FundraiserProvider>(context, listen: false)
              .updateFundraiser({"status": 'active'});
          if (fundraiserProvider.updateResponse?.error == null) {
            showGeneralDialog(
              context: context,
              pageBuilder: (context, anim1, anim2) => const SizedBox(),
              transitionDuration: const Duration(milliseconds: 400),
              transitionBuilder: (context, anim1, anim2, child) {
                return SlideTransition(
                  position: Tween(
                    begin: const Offset(1, 0),
                    end: const Offset(0, 0),
                  ).animate(anim1),
                  child: TopUpAlert(
                    title: 'Fundraiser Activated Successfully.',
                    tapped: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                      Navigator.pop(context);
                      Navigator.pop(context);
                    },
                  ),
                );
              },
            );
          }
        },
      ),
    );
  }

  void _showCancelDialog(FundraiserProvider fundraiserProvider) {
    showAdaptiveDialog(
      context: context,
      builder: (context) => ConfirmAlert(
        text: "Cancel Fundraiser?",
        pressed: () async {
          showAdaptiveDialog(
            context: context,
            builder: (context) => AiAnalysisAlert(
              icon: HugeIcons.strokeRoundedMoneySavingJar,
              action: 'Deactivating Fundraiser',
            ),
          );
          await Provider.of<FundraiserProvider>(context, listen: false)
              .updateFundraiser({"status": 'cancelled'});
          if (fundraiserProvider.updateResponse?.error == null) {
            showGeneralDialog(
              context: context,
              pageBuilder: (context, anim1, anim2) => const SizedBox(),
              transitionDuration: const Duration(milliseconds: 400),
              transitionBuilder: (context, anim1, anim2, child) {
                return SlideTransition(
                  position: Tween(
                    begin: const Offset(1, 0),
                    end: const Offset(0, 0),
                  ).animate(anim1),
                  child: TopUpAlert(
                    title: 'Fundraiser Deactivated Successfully.',
                    tapped: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                      Navigator.pop(context);
                      Navigator.pop(context);
                    },
                  ),
                );
              },
            );
          }
        },
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return HexColor(AppColors.primaryGreen);
      case 'completed':
        return HexColor(AppColors.brightGreen);
      case 'cancelled':
        return HexColor(AppColors.red);
      case 'inactive':
        return HexColor(AppColors.darkerGray2);
      default:
        return HexColor(AppColors.primaryGreen);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return HugeIcons.strokeRoundedActivity01;
      case 'completed':
        return HugeIcons.strokeRoundedCheckmarkCircle02;
      case 'cancelled':
        return HugeIcons.strokeRoundedCancel01;
      case 'inactive':
        return HugeIcons.strokeRoundedPause;
      default:
        return HugeIcons.strokeRoundedActivity01;
    }
  }
}
