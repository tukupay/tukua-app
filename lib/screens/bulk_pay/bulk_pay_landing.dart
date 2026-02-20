import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../routes.dart';

class BulkPayLanding extends StatefulWidget {
  const BulkPayLanding({super.key});

  @override
  State<BulkPayLanding> createState() => _BulkPayLandingState();
}

class _BulkPayLandingState extends State<BulkPayLanding> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializePage();
    });
  }

  /// Initialize page: select wallet immediately, load contacts in background only if needed
  void _initializePage() {
    final wallets = Provider.of<WalletProvider>(context, listen: false);
    final bulkPay = Provider.of<BulkPayProvider>(context, listen: false);
    final contactProvider = Provider.of<DeviceContactProvider>(context, listen: false);

    // Select wallet immediately (synchronous - no UI blocking)
    if (wallets.userWallets.isNotEmpty) {
      final primaryWallet = wallets.userWallets.firstWhere(
        (wallet) => wallet.isPrimary == true,
        orElse: () => wallets.userWallets.first,
      );
      bulkPay.selectWallet(primaryWallet);
    }

    // Only fetch contacts if not already loaded (shared with BulkSMS)
    // This prevents duplicate fetches and uses cached contacts
    if (contactProvider.simpleContacts.isEmpty && !contactProvider.isLoading) {
      // Fire and forget - don't await to avoid blocking
      contactProvider.refreshContacts();
    } else if (contactProvider.filteredContacts.isEmpty && contactProvider.simpleContacts.isNotEmpty) {
      // Contacts exist but filtered is empty - reset to show all
      contactProvider.resetSearch();
    }
  }

  void _showWalletSelector(BuildContext context, BulkPayProvider bulkPay, WalletProvider wallets) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: HexColor('#E0E0E0'),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: HexColor('#E8F5E9'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedWallet03,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text('Select Wallet', style: Blacks.regularBoldCodeNext),
              ],
            ),
            const SizedBox(height: 20),
            // Wallets list
            ListView.separated(
              shrinkWrap: true,
              itemCount: wallets.userWallets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final wallet = wallets.userWallets[index];
                final isSelected = bulkPay.selectedWallet?.id == wallet.id;
                return GestureDetector(
                  onTap: () {
                    bulkPay.selectWallet(wallet);
                    Navigator.pop(context);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? HexColor(AppColors.primaryGreen).withAlpha(25)
                          : HexColor('#F8FAF9'),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? HexColor(AppColors.primaryGreen)
                            : HexColor('#E8ECE9'),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                HexColor(AppColors.primaryGreen),
                                HexColor(AppColors.fadedGreen),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            HugeIcons.strokeRoundedWallet02,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                wallet.name ?? wallet.purposeTag ?? 'Wallet',
                                style: Blacks.smallestBoldPoppins),
                              const SizedBox(height: 4),
                              Text('KSH ${formatThousands(amount: wallet.balance ?? 0, noDecimal: true)}',
                                style: Greens.smallBoldInter,
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Icon(
                            HugeIcons.strokeRoundedCheckmarkCircle01,
                            color: HexColor(AppColors.primaryGreen),
                            size: 24,
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
            SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<BulkPayProvider>(context,listen: false).resetSelected();
        Provider.of<DeviceContactProvider>(context, listen: false).resetSearch();
      },
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer3<BulkPayProvider,WalletProvider,DeviceContactProvider>(
          builder: (_,bulkPay,wallets,deviceContactsProvider,__) {
            return Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover)
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
                    // Fixed App Bar
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                                    color: HexColor(AppColors.darkerGray2), size: 20),
                              ),
                            ),
                            const Spacer(),
                            Column(
                              children: [
                                Text('Bulk Pay', style: Blacks.mediumSemiRubik),
                                Text('Send to multiple people', style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                              ],
                            ),
                            const Spacer(),
                            GestureDetector(
                              onTap: () => Navigator.pushNamed(context, Routes.bulkPayHistory),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#F0F4F3'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              child: Icon(Icons.history,
                                    color: HexColor(AppColors.darkerGray2), size: 20),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Wallet Selector Card
                    _buildWalletSelectorCard(bulkPay, wallets),

                    // Scrollable Content using NestedScrollView for better performance
                    Expanded(
                      child: NestedScrollView(
                        headerSliverBuilder: (context, innerBoxIsScrolled) {
                          return [
                            // Tip Card
                            SliverToBoxAdapter(
                              child: Container(
                                margin: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: HexColor('#FFF9E6'),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: HexColor('#FFE082')),
                                ),
                                child: Row(
                                  children: [
                                    Icon(HugeIcons.strokeRoundedInformationCircle,
                                        color: HexColor('#F57C00'), size: 18),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        'Use our tuku.money dashboard for wallet and bank transfers',
                                        style: TextStyle(
                                          color: HexColor('#5D4037'),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            // Recipient Type Selector
                            const SliverToBoxAdapter(
                              child: Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16),
                                child: BulkRecipientSection(),
                              ),
                            ),
                            const SliverToBoxAdapter(child: SizedBox(height: 16)),
                          ];
                        },
                        // Contacts Selection - uses ListView.builder for virtualization
                        body: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: BulkContactsSelect(),
                        ),
                      ),
                    ),

                    // Bottom Action Button
                    const BulkPayBottomAction(),
                  ],
                ),
              ),
            );
          }
        ),
      ),
    );
  }

  Widget _buildWalletSelectorCard(BulkPayProvider bulkPay, WalletProvider wallets) {
    return GestureDetector(
      onTap: () => _showWalletSelector(context, bulkPay, wallets),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [HexColor(AppColors.primaryGreen), HexColor(AppColors.fadedGreen)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: HexColor(AppColors.primaryGreen).withAlpha(76),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // Wallet Icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(51),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(HugeIcons.strokeRoundedWallet03,
                  color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            // Wallet Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Payment Source',
                    style: Whites.tinyPoppins.copyWith(
                      color: Colors.white.withAlpha(204),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    bulkPay.selectedWallet?.name ??
                    bulkPay.selectedWallet?.purposeTag ??
                    'Select Wallet',
                    style: Whites.mediumSemiRoboto.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (bulkPay.selectedWallet != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'KSH ${formatThousands(amount: bulkPay.selectedWallet!.balance ?? 0, noDecimal: true)}',
                      style: Whites.smallBoldRoboto.copyWith(
                        color: Colors.white.withAlpha(230),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Change Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Change',
                    style: TextStyle(
                      color: HexColor(AppColors.primaryGreen),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(HugeIcons.strokeRoundedArrowDown01,
                      color: HexColor(AppColors.primaryGreen), size: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
