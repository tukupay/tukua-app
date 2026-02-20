import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:readmore/readmore.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';

class PublicFundraiserDetails extends StatefulWidget {
  const PublicFundraiserDetails({super.key});

  @override
  State<PublicFundraiserDetails> createState() => _PublicFundraiserDetailsState();
}

class _PublicFundraiserDetailsState extends State<PublicFundraiserDetails> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Provider.of<FundraiserProvider>(context, listen: false).getMyContributions();
    });
  }

  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final amountController = TextEditingController();

  @override
  Widget build(BuildContext context) {

    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<FundraiserProvider>(context, listen: false).resetFundraiser();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Consumer4<FundraiserProvider, ProfileProvider, WalletProvider, PaymentsProvider>(
          builder: (_, fundraiserProvider, profile, walletProvider, payments, __) {
            if (fundraiserProvider.selectedFundraiser == null) {
              return const SizedBox();
            }

            final fundraiser = fundraiserProvider.selectedFundraiser!;
            final isOwner = fundraiser.ownerId == profile.user?.userId;
            final progress = (fundraiser.amountRaised! / fundraiser.goalAmount! * 100).clamp(0, 100);

            return RefreshIndicator(
              color: HexColor(AppColors.primaryGreen),
              onRefresh: () async {
                await Provider.of<FundraiserProvider>(context, listen: false)
                    .getAllFundraisers(isRefresh: true);
              },
              child: CustomScrollView(
                slivers: [
                  // Hero App Bar with image
                  SliverAppBar(
                    expandedHeight: 320,
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
                        padding: Paddings.tinyAllSides,
                        margin: const EdgeInsets.all(8),
                        alignment: Alignment.center,
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
                                  Colors.black.withAlpha(200),
                                ],
                              ),
                            ),
                          ),
                          // Progress badge
                          Positioned(
                            top: 100,
                            right: 16,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryGreen),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: HexColor(AppColors.primaryGreen).withAlpha(80),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    HugeIcons.strokeRoundedAnalytics02,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${progress.toInt()}% Raised',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          // Bottom stats card
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            child: ClipRRect(
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                child: Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withAlpha(220),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: _buildStatItem(
                                          'Raised',
                                          'KES ${formatThousands(amount: fundraiser.amountRaised!, noDecimal: true)}',
                                          HexColor(AppColors.primaryGreen),
                                        ),
                                      ),
                                      Container(
                                        width: 1,
                                        height: 40,
                                        color: HexColor(AppColors.lightGray),
                                      ),
                                      Expanded(
                                        child: _buildStatItem(
                                          'Goal',
                                          'KES ${formatThousands(amount: fundraiser.goalAmount!, noDecimal: true)}',
                                          HexColor(AppColors.darkerGray2),
                                        ),
                                      ),
                                      Container(
                                        width: 1,
                                        height: 40,
                                        color: HexColor(AppColors.lightGray),
                                      ),
                                      Expanded(
                                        child: _buildStatItem(
                                          'Contributors',
                                          '${fundraiser.contributionsCount ?? 0}',
                                          HexColor(AppColors.primaryOrange),
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
                                    Row(
                                      children: [
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
                                        if (isOwner) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: HexColor(AppColors.primaryOrange).withAlpha(15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  HugeIcons.strokeRoundedUserCircle,
                                                  size: 14,
                                                  color: HexColor(AppColors.primaryOrange),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  'Your fundraiser',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color: HexColor(AppColors.primaryOrange),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ],
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
                          // Progress bar
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: HexColor(AppColors.lightestGray).withAlpha(80),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Container(
                                  height: 10,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: HexColor(AppColors.lightestGray),
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                  child: FractionallySizedBox(
                                    alignment: Alignment.centerLeft,
                                    widthFactor: (progress / 100).clamp(0.0, 1.0),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            HexColor(AppColors.primaryGreen),
                                            HexColor(AppColors.brightGreen),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(5),
                                        boxShadow: [
                                          BoxShadow(
                                            color: HexColor(AppColors.primaryGreen).withAlpha(60),
                                            blurRadius: 8,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Action buttons
                          Row(
                            children: [
                              Expanded(
                                child: _buildActionCard(
                                  icon: HugeIcons.strokeRoundedCash01,
                                  title: 'Give',
                                  subtitle: 'Your Giving',
                                  amount: _getMyGivingAmount(fundraiserProvider),
                                  color: HexColor(AppColors.primaryGreen),
                                  onTap: () => _handleGiving(fundraiserProvider, payments, profile),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildActionCard(
                                  icon: HugeIcons.strokeRoundedTips,
                                  title: 'Pledge',
                                  subtitle: 'Your Pledge',
                                  amount: _getMyPledgeAmount(fundraiserProvider),
                                  color: fundraiser.allowPledges == false
                                      ? HexColor(AppColors.lightGray)
                                      : HexColor(AppColors.primaryOrange),
                                  onTap: () => _handlePledge(fundraiserProvider, profile),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          // Description
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: HexColor(AppColors.lightestGray)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(8),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
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
                          // Tabs
                          PublicFundraiserTabs(),
                          const SizedBox(height: 40),
                        ],
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

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: HexColor(AppColors.darkerGray2),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: color,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required double amount,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withAlpha(60), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: color.withAlpha(20),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 22, color: color),
                ),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'KES ${formatThousands(amount: amount, noDecimal: true)}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  double _getMyGivingAmount(FundraiserProvider fundraiserProvider) {
    final contributions = fundraiserProvider.contributions.where(
      (el) => el.campaignId == fundraiserProvider.selectedFundraiser?.id,
    );
    if (contributions.isEmpty) return 0;
    return contributions.fold(0.0, (sum, c) => sum + (c.amount ?? 0));
  }

  double _getMyPledgeAmount(FundraiserProvider fundraiserProvider) {
    final pledges = fundraiserProvider.myPledges.where(
      (el) => el.campaignId == fundraiserProvider.selectedFundraiser?.id,
    );
    if (pledges.isEmpty) return 0;
    return pledges.first.amount ?? 0;
  }

  void _handleGiving(FundraiserProvider fundraiserProvider, PaymentsProvider payments, ProfileProvider profile) {
    Fluttertoast.cancel();
    if (profile.user?.email == null || profile.user!.email!.isEmpty) {
      Fluttertoast.showToast(msg: "Please add your email address in profile settings to contribute");
      return;
    }
    final existingPledge = fundraiserProvider.myPledges.where(
      (el) => el.campaignId == fundraiserProvider.selectedFundraiser?.id,
    );

    if (existingPledge.isNotEmpty && existingPledge.first.amountRemaining != 0) {
      showAdaptiveDialog(
        context: context,
        builder: (context) => ConfirmAlert(
          text: "Fulfill my existing pledge",
          pressed: () async {
            Navigator.pop(context);
            showModalBottomSheet(
              isScrollControlled: true,
              scrollControlDisabledMaxHeightRatio: 1 / 1,
              context: context,
              builder: (givingContext) {
                return DecoratedSheet(
                  title: "Select your method",
                  items: payments.paymentMethods.length,
                  body: PledgePaymentOptions(),
                  height: 480,
                );
              },
            );
          },
        ),
      );
    } else {
      showModalBottomSheet(
        isScrollControlled: true,
        scrollControlDisabledMaxHeightRatio: 1 / 1,
        context: context,
        builder: (givingContext) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: DecoratedSheet(
              title: "Select your method",
              items: payments.paymentMethods.length,
              body: GivingPaymentOptions(),
              height: 480,
            ),
          );
        },
      );
    }
  }

  void _handlePledge(FundraiserProvider fundraiserProvider, ProfileProvider profile) {
    if (profile.user?.email == null || profile.user!.email!.isEmpty) {
      Fluttertoast.cancel();
      Fluttertoast.showToast(msg: "Please add your email address in profile settings to pledge");
      return;
    }
    if (fundraiserProvider.selectedFundraiser?.allowPledges == false) {
      Fluttertoast.cancel();
      Fluttertoast.showToast(msg: "Pledging has been disabled for this fundraiser");
      return;
    }

    final existingPledge = fundraiserProvider.myPledges.where(
      (p) => p.campaignId == fundraiserProvider.selectedFundraiser?.id,
    );

    if (existingPledge.isNotEmpty) {
      Fluttertoast.cancel();
      Fluttertoast.showToast(msg: "You have already pledged to this fundraiser. You can update it.");
      return;
    }

    String firstName = profile.user?.firstName ?? 'Your';
    String lastName = profile.user?.lastName ?? 'Name';
    String businessName = profile.user?.businessName ?? 'Business';
    nameController.text = profile.user?.type == Strings.individualAcc ? '$firstName $lastName' : businessName;
    phoneController.text = profile.user?.phoneNumber ?? 'Your Phone';
    emailController.text = profile.user?.email ?? "Your Email";

    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: PlainSheet(
            title: "Add Pledge",
            subTitle: "Pledge to this campaign",
            body: NewPledgerForm(
              nameController: nameController,
              nameEnabled: false,
              phoneController: phoneController,
              phoneEnabled: false,
              emailController: emailController,
              emailEnabled: false,
              amountController: amountController,
              tapped: () async {
                if (amountController.text.isEmpty) {
                  Fluttertoast.cancel();
                  Fluttertoast.showToast(msg: "Enter an amount");
                } else {
                  final pledge = PledgeRequest(
                    pledgerName: nameController.text,
                    pledgerEmail: emailController.text,
                    pledgerPhone: phoneController.text,
                    amount: double.parse(amountController.text),
                  );
                  debugPrint(pledge.toJson().toString());
                  showAdaptiveDialog(
                    context: context,
                    builder: (context) => AiAnalysisAlert(
                      icon: HugeIcons.strokeRoundedHealtcare,
                      action: 'Pledging',
                    ),
                  );
                  await Provider.of<FundraiserProvider>(context, listen: false).makePledge(pledge);
                  Navigator.pop(context);
                  Navigator.pop(context);
                  nameController.clear();
                  emailController.clear();
                  phoneController.clear();
                  amountController.clear();
                  if (fundraiserProvider.pledgeResponse?.error == null) {
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
                          child: SuccessAlert(
                            title: 'Operation Successful',
                            content: 'Pledge Added Successfully! Select a pledge to edit.',
                            tapped: () => Navigator.pop(context),
                            anim1: anim1,
                          ),
                        );
                      },
                    );
                  }
                }
              },
            ),
            height: 500,
          ),
        );
      },
    );
  }
}
