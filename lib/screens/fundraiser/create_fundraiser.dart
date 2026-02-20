import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';

import '../../providers/providers.dart';

class CreateFundraiser extends StatefulWidget {
  const CreateFundraiser({super.key});

  @override
  State<CreateFundraiser> createState() => _CreateFundraiserState();
}

class _CreateFundraiserState extends State<CreateFundraiser> {
  final titleController = TextEditingController();
  final donationController = TextEditingController();
  final descriptionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Fetch categories and available wallets when page loads
    WidgetsBinding.instance.addPostFrameCallback((_) async{
      final fundraiserProvider = Provider.of<FundraiserProvider>(context, listen: false);
      await fundraiserProvider.getCategories();
      await fundraiserProvider.fetchAvailableWallets();
    });
  }

  // Show category selection bottom sheet
  void _showCategorySelector(FundraiserProvider fundraiserProvider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CategorySelectorSheet(
        categories: fundraiserProvider.categories,
        selectedCategory: fundraiserProvider.selectedCategory,
        onSelected: (category) {
          Provider.of<FundraiserProvider>(context, listen: false)
              .selectCategory(category);
        },
      ),
    );
  }

  // Show wallet selection bottom sheet
  void _showWalletSelector(
      FundraiserProvider fundraiserProvider, WalletProvider walletProvider) async {
    final result = await UniversalWalletSelector.show(
      context,
      wallets: walletProvider.userWallets,
      selectedWallet: fundraiserProvider.selectedWalletFull,
      title: 'Collection Wallet',
      subtitle: 'Where donations will be collected',
      showBalance: true,
    );

    if (result != null && mounted) {
      Provider.of<FundraiserProvider>(context, listen: false)
          .selectWalletFull(result);
    }
  }

  // Validate and submit fundraiser
  Future<void> _submitFundraiser(FundraiserProvider fundraiserProvider) async {
    if (fundraiserProvider.coverImage == null) {
      Fluttertoast.showToast(msg: "Add a cover photo for your fundraiser");
    } else if (titleController.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: "What's your fundraiser's title?");
    } else if (fundraiserProvider.selectedCategory == null) {
      Fluttertoast.showToast(msg: "Which category suits your fundraiser");
    } else if (donationController.text.trim().isEmpty) {
      Fluttertoast.showToast(
          msg: "What is contribution goal for this fundraiser?");
    } else if (fundraiserProvider.startDate == null) {
      Fluttertoast.showToast(
          msg: "Specify the date which this fundraiser will be active");
    } else if (fundraiserProvider.endDate == null) {
      Fluttertoast.showToast(
          msg: "Specify the date which this fundraiser will expire");
    } else if (fundraiserProvider.selectedWalletFull == null) {
      Fluttertoast.showToast(msg: "Select a wallet to receive the contribution");
    } else if (descriptionController.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: "Add some description about your fundraiser..");
    } else {
      final fundraiser = FundraiserRequest(
          title: titleController.text,
          category: fundraiserProvider.selectedCategory!,
          description: descriptionController.text,
          coverPhoto: fundraiserProvider.coverImage!,
          otherImages: fundraiserProvider.otherImages,
          goalAmount: double.parse(donationController.text),
          startDate: fundraiserProvider.startDate!,
          endDate: fundraiserProvider.endDate!,
          walletId: fundraiserProvider.selectedWalletFull!.id!,
          analyticsPublic: fundraiserProvider.publicAnalytics,
          allowPledges: fundraiserProvider.allowPledging,
          isPublic: fundraiserProvider.publiclyVisible);

      showAdaptiveDialog(
          context: context,
          builder: (context) => AiAnalysisAlert(
                icon: HugeIcons.strokeRoundedMoneySavingJar,
                action: "Creating Fundraiser",
              ));

      await Provider.of<FundraiserProvider>(context, listen: false)
          .createFundraiser(fundraiser);
      Navigator.pop(context);

      if (fundraiserProvider.createResponse?.error == null) {
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
                    title: 'Fundraiser Created',
                    content:
                        'You can edit your Fundraising details in the fundraiser module.',
                    tapped: () {
                      Provider.of<FundraiserProvider>(context, listen: false)
                          .clearFundraiser();
                      Navigator.pop(context);
                      Navigator.pop(context);
                    },
                    anim1: anim1),
              );
            });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer2<FundraiserProvider, WalletProvider>(
          builder: (_, fundraiserProvider, walletProvider, __) {
        return Container(
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
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: HexColor('#F0F4F3'),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                color: HexColor(AppColors.darkerGray2),
                                size: 20),
                          ),
                        ),
                        const Spacer(),
                        Column(
                          children: [
                            Text('Create Fundraiser',
                                style: Blacks.mediumSemiRubik),
                            Text('Start your campaign',
                                style: Grays.smallestPoppinsHint
                                    .copyWith(fontSize: 10)),
                          ],
                        ),
                        const Spacer(),
                        NotificationsBell(),
                      ],
                    ),
                  ),
                ),

                // Scrollable Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 12),

                        // Images Section
                        FundraiserFormCard(
                          title: 'Campaign Images',
                          icon: HugeIcons.strokeRoundedImage01,
                          iconBgColor: HexColor('#E3F2FD'),
                          iconColor: HexColor('#1976D2'),
                          child: FundraiserImagePickers(),
                        ),
                        const SizedBox(height: 16),

                        // Basic Info Section
                        FundraiserFormCard(
                          title: 'Basic Information',
                          icon: HugeIcons.strokeRoundedInformationCircle,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Title Field
                              LabeledField(
                                  label: "Title",
                                  hint: 'Give your fundraiser a catchy title',
                                  controller: titleController,
                                  enabled: true),
                              const SizedBox(height: 14),

                              // Category Selector
                              Text('Category', style: Blacks.tinyBolderPoppins),
                              const SizedBox(height: 6),
                              _buildSelectorButton(
                                onTap: () =>
                                    _showCategorySelector(fundraiserProvider),
                                icon: HugeIcons.strokeRoundedFolder01,
                                label: fundraiserProvider.selectedCategory ??
                                    'Select a category',
                                isSelected:
                                    fundraiserProvider.selectedCategory != null,
                                accentColor: HexColor('#FB8C00'),
                              ),
                              const SizedBox(height: 14),

                              // Target Amount
                              LabeledField(
                                  label: 'Fundraising Goal',
                                  controller: donationController,
                                  hint: 'How much do you want to raise?',
                                  isNumber: true,
                                  prefixIcon: Icon(
                                    HugeIcons.strokeRoundedCoins01,
                                    color: HexColor(AppColors.primaryGreen),
                                    size: 20,
                                  ),
                                  enabled: true),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Schedule Section
                        FundraiserFormCard(
                          title: 'Campaign Schedule',
                          icon: HugeIcons.strokeRoundedCalendar02,
                          iconBgColor: HexColor('#FFF3E0'),
                          iconColor: HexColor('#FB8C00'),
                          child: FundraiserDates(),
                        ),
                        const SizedBox(height: 16),

                        // Collection Wallet Section
                        FundraiserFormCard(
                          title: 'Collection Wallet',
                          icon: HugeIcons.strokeRoundedWallet03,
                          child: fundraiserProvider.availableWallets.isEmpty
                              ? EmptyAccountsHint(isFundraiser: true)
                              : _buildWalletCard(
                              fundraiserProvider, walletProvider),
                        ),
                        const SizedBox(height: 16),

                        // Description Section
                        FundraiserFormCard(
                          title: 'Description',
                          icon: HugeIcons.strokeRoundedTextSquare,
                          iconBgColor: HexColor('#F3E5F5'),
                          iconColor: HexColor('#7B1FA2'),
                          child: LabeledField(
                              label: '',
                              hint:
                                  'Tell your story. Why is this fundraiser important?',
                              controller: descriptionController,
                              multiLine: true,
                              enabled: true),
                        ),
                        const SizedBox(height: 16),

                        // Options Section
                        FundraiserFormCard(
                          title: 'Fundraiser Options',
                          icon: HugeIcons.strokeRoundedSettings02,
                          iconBgColor: HexColor('#E0F2F1'),
                          iconColor: HexColor('#00897B'),
                          child: Column(
                            children: [
                              FundraiserToggleOption(
                                title: 'Public Visibility',
                                description:
                                    'Make this fundraiser visible to everyone',
                                value: fundraiserProvider.publiclyVisible,
                                icon: HugeIcons.strokeRoundedGlobal,
                                onChanged: (val) {
                                  Provider.of<FundraiserProvider>(context,
                                          listen: false)
                                      .setPublicity(val);
                                },
                              ),
                              const SizedBox(height: 10),
                              FundraiserToggleOption(
                                title: 'Allow Pledging',
                                description:
                                    'Let supporters pledge future donations',
                                value: fundraiserProvider.allowPledging,
                                icon: HugeIcons.strokeRoundedHandPrayer,
                                onChanged: (val) {
                                  Provider.of<FundraiserProvider>(context,
                                          listen: false)
                                      .setAllowPledging(val);
                                },
                              ),
                              const SizedBox(height: 10),
                              FundraiserToggleOption(
                                title: 'Public Analytics',
                                description:
                                    'Show collection progress to supporters',
                                value: fundraiserProvider.publicAnalytics,
                                icon: HugeIcons.strokeRoundedAnalytics02,
                                onChanged: (val) {
                                  Provider.of<FundraiserProvider>(context,
                                          listen: false)
                                      .setAnalyticsPublic(val);
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),

                // Bottom Action Button
                _buildBottomAction(fundraiserProvider),
              ],
            ),
          ),
        );
      }),
    );
  }

  // Selector button widget for category
  Widget _buildSelectorButton({
    required VoidCallback onTap,
    required IconData icon,
    required String label,
    required bool isSelected,
    Color? accentColor,
  }) {
    final color = accentColor ?? HexColor(AppColors.primaryGreen);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color.withAlpha(15) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : HexColor('#E8ECE9'),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: isSelected ? color : HexColor('#9E9E9E')),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? color : HexColor('#757575'),
                ),
              ),
            ),
            Icon(
              HugeIcons.strokeRoundedArrowDown01,
              size: 16,
              color: isSelected ? color : HexColor('#9E9E9E'),
            ),
          ],
        ),
      ),
    );
  }

  // Wallet selection card
  Widget _buildWalletCard(
      FundraiserProvider fundraiserProvider, WalletProvider walletProvider) {
    final wallet = fundraiserProvider.selectedWalletFull;

    return GestureDetector(
      onTap: () => _showWalletSelector(fundraiserProvider, walletProvider),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: wallet != null
              ? LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    HexColor(AppColors.primaryGreen),
                    HexColor(AppColors.fadedGreen),
                  ],
                )
              : null,
          color: wallet == null ? HexColor('#F8FAF9') : null,
          borderRadius: BorderRadius.circular(14),
          border: wallet == null
              ? Border.all(color: HexColor('#E8ECE9'))
              : null,
          boxShadow: wallet != null
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
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: wallet != null
                    ? Colors.white.withAlpha(51)
                    : HexColor('#E8ECE9'),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                wallet?.isLinkedToBank == true
                    ? HugeIcons.strokeRoundedBank
                    : HugeIcons.strokeRoundedWallet02,
                color: wallet != null ? Colors.white : HexColor('#757575'),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    wallet != null
                        ? ((wallet.name ?? '').isNotEmpty
                            ? wallet.name!
                            : 'Wallet ${wallet.id ?? ''}')
                        : 'Tap to select wallet',
                    style: wallet != null
                        ? Whites.smallBoldRoboto
                        : Grays.smallestPoppinsHint,
                  ),
                  if (wallet != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (wallet.isLinkedToBank == true)
                          Icon(
                            HugeIcons.strokeRoundedBank,
                            color: Colors.white.withAlpha(200),
                            size: 12,
                          ),
                        if (wallet.isLinkedToBank == true)
                          const SizedBox(width: 4),
                        Text(
                          wallet.isLinkedToBank == true
                              ? 'Bank Linked'
                              : (wallet.isActive == true
                                  ? 'Active'
                                  : 'Inactive'),
                          style: Whites.tinyPoppins.copyWith(
                            color: Colors.white.withAlpha(200),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: wallet != null ? Colors.white : HexColor('#E8ECE9'),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    wallet != null ? 'Change' : 'Select',
                    style: TextStyle(
                      color: wallet != null
                          ? HexColor(AppColors.primaryGreen)
                          : HexColor('#757575'),
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    HugeIcons.strokeRoundedArrowDown01,
                    color: wallet != null
                        ? HexColor(AppColors.primaryGreen)
                        : HexColor('#757575'),
                    size: 12,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Bottom action bar
  Widget _buildBottomAction(FundraiserProvider fundraiserProvider) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: ElevatedButton(
          onPressed: () => _submitFundraiser(fundraiserProvider),
          style: ElevatedButton.styleFrom(
            backgroundColor: HexColor(AppColors.primaryGreen),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(HugeIcons.strokeRoundedMoneySavingJar, size: 20),
              const SizedBox(width: 10),
              const Text(
                'CREATE FUNDRAISER',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
