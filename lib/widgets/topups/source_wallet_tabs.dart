import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Tabbed widget for selecting source wallet - either from own wallets or by searching for a user
class SourceWalletTabs extends StatefulWidget {
  final FullWallet? selectedWallet;
  final List<FullWallet> userWallets;
  final ValueChanged<FullWallet> onWalletSelected;
  final ValueChanged<WalletSearchResult>? onSearchedWalletSelected;

  const SourceWalletTabs({
    super.key,
    required this.selectedWallet,
    required this.userWallets,
    required this.onWalletSelected,
    this.onSearchedWalletSelected,
  });

  @override
  State<SourceWalletTabs> createState() => _SourceWalletTabsState();
}

class _SourceWalletTabsState extends State<SourceWalletTabs>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();


  // Store provider reference for cleanup
  WalletProvider? _walletProvider;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Listen for tab changes to reset search when switching to My Wallets
    _tabController.addListener(_onTabChanged);

    // Reset search state when widget initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WalletProvider>(context, listen: false).resetSearch();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _walletProvider ??= Provider.of<WalletProvider>(context, listen: false);
  }

  void _onTabChanged() {
    // When switching to My Wallets tab, reset search state
    if (_tabController.index == 0 && !_tabController.indexIsChanging) {
      _searchController.clear();
      _walletProvider?.resetSearch();
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _searchController.dispose();
    // Reset search state after frame completes to avoid calling notifyListeners during dispose
    final provider = _walletProvider;
    if (provider != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        provider.resetSearch();
      });
    }
    super.dispose();
  }

  // Validation functions
  bool _isWalletAlias(String val) => RegExp(r'^[a-zA-Z][a-zA-Z0-9]{5}$').hasMatch(val);
  bool _isPhoneNumber(String val) => RegExp(r'^07\d{8}$').hasMatch(val);
  bool _isFullyNumeric(String val) => RegExp(r'^\d+$').hasMatch(val);

  Future<void> _validateDestination(String val) async {
    Fluttertoast.cancel();
    Provider.of<WalletProvider>(context, listen: false).resetSearch();

    // Fully numeric input - treat as phone number
    if (_isFullyNumeric(val)) {
      // Valid phone number format
      if (_isPhoneNumber(val)) {
        await Provider.of<WalletProvider>(context, listen: false).searchWallets(val);
        return;
      }
      // Phone number in progress (starts with 07, less than 10 digits) - no toast
      if (val.startsWith('07') && val.length < 10) {
        return;
      }
      // Exceeded phone number length
      if (val.startsWith('07') && val.length > 10) {
        Fluttertoast.showToast(msg: 'Error: Phone number cannot be more than 10 digits');
        return;
      }
      // Numeric but doesn't start with 07 - wait until they type more or show hint
      if (val.length >= 10 && !val.startsWith('07')) {
        Fluttertoast.showToast(msg: 'Phone must start with 07');
        return;
      }
      // Still typing numbers - no toast, just wait
      return;
    }

    // Alphanumeric input - treat as wallet alias
    if (val.length > 6) {
      Fluttertoast.showToast(msg: 'Error: Wallet alias cannot be more than 6 characters');
      return;
    }

    // Valid wallet alias format
    if (_isWalletAlias(val)) {
      await Provider.of<WalletProvider>(context, listen: false).searchWallets(val);
      return;
    }

    // Invalid alias format (6 chars but doesn't match pattern)
    if (val.length == 6 && !_isWalletAlias(val)) {
      Fluttertoast.showToast(msg: 'Alias must start with a letter');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: [
            Icon(
              HugeIcons.strokeRoundedWalletRemove01,
              size: 14,
              color: HexColor(AppColors.primaryGreen),
            ),
            const SizedBox(width: 6),
            Text('Select source wallet', style: Grays.smallestBolderPoppinsHint),
          ],
        ),
        const SizedBox(height: 8),

        // Tab Bar
        Container(
          decoration: BoxDecoration(
            color: HexColor('#F8FAF9'),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: HexColor('#E0E5E2')),
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: HexColor(AppColors.primaryGreen).withAlpha(100),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(8),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            labelColor: HexColor(AppColors.primaryGreen),
            unselectedLabelColor: Colors.grey.shade600,
            labelStyle: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            tabs: const [
              Tab(text: 'My Wallets'),
              Tab(text: 'Search User'),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Tab Content - Fixed height container
        SizedBox(
          height: 200,
          child: TabBarView(
            controller: _tabController,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              // Tab 1: My Wallets
              _buildMyWalletsTab(),

              // Tab 2: Search User
              _buildSearchUserTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMyWalletsTab() {
    if (widget.userWallets.isEmpty) {
      return const Center(child: EmptyAccountsHint());
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Wallet selector
          WalletSelectorCard(
            selectedWallet: widget.selectedWallet,
            wallets: widget.userWallets,
            onSelected: (wallet) {
              widget.onWalletSelected(wallet);
            },
            label: '',
            sheetTitle: 'Source Wallet',
            sheetSubtitle: 'Select wallet to transfer from',
            isSource: true,
          ),

          const SizedBox(height: 12),

          // Info hint about searching for other users
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(10),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: HexColor(AppColors.primaryGreen).withAlpha(50),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  size: 16,
                  color: HexColor(AppColors.primaryGreen),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Need funds from someone else?',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: HexColor(AppColors.primaryGreen),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Switch to "Search User" tab to receive from another TukuPay user',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade700,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchUserTab() {
    return Consumer<WalletProvider>(
      builder: (_, wallets, __) {
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search input
              LabeledField(
                controller: _searchController,
                label: 'Phone | Wallet Number',
                hint: '6-10 characters',
                changed: (val) async {
                  if (val != null && val.isNotEmpty) {
                    await _validateDestination(val);
                  } else {
                    Provider.of<WalletProvider>(context, listen: false)
                        .resetSearch();
                  }
                },
                canGoNext: true,
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedUser,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

              const SizedBox(height: 8),

              // Search result indicator
              _buildSearchResultIndicator(wallets),

              const SizedBox(height: 12),

              // Info note
              InfoNote(
                text: 'Search by phone number or wallet alias to receive funds from another TukuPay user',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchResultIndicator(WalletProvider wallets) {
    if (wallets.searching) {
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
            const SizedBox(width: 8),
            Text('Searching...', style: Grays.smallestPoppinsHint),
          ],
        ),
      );
    }

    if (wallets.searchResult == null) return const SizedBox();

    if (wallets.searchResult?.error != null) {
      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: HexColor(AppColors.red).withAlpha(15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: HexColor(AppColors.red).withAlpha(30)),
        ),
        child: Row(
          children: [
            Icon(HugeIcons.strokeRoundedAlertCircle,
                size: 16, color: HexColor(AppColors.red)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                wallets.searchResult!.error ?? 'User not found',
                style: Reds.tinySemiRoboto,
              ),
            ),
          ],
        ),
      );
    }

    // Found user - show success with their wallet info
    return GestureDetector(
      onTap: () {
        if (wallets.searchResult != null && widget.onSearchedWalletSelected != null) {
          widget.onSearchedWalletSelected!(wallets.searchResult!);
          Fluttertoast.showToast(msg: 'Selected ${wallets.searchResult!.name}');
        }
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen).withAlpha(15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: HexColor(AppColors.primaryGreen).withAlpha(80),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                HugeIcons.strokeRoundedCheckmarkCircle01,
                size: 16,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'User found',
                    style: Greens.tinySemiRoboto,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    wallets.searchResult!.name ?? 'Verified wallet',
                    style: Blacks.smallestBoldPoppins,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
