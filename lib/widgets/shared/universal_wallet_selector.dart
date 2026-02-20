import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/routes.dart';

/// Universal bottom sheet for wallet selection across the app
/// Replaces DynamicDropdownMenu for wallet selection use cases
class UniversalWalletSelector extends StatelessWidget {
  final List<FullWallet> wallets;
  final FullWallet? selectedWallet;
  final ValueChanged<FullWallet> onSelected;
  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool showBalance;

  const UniversalWalletSelector({
    super.key,
    required this.wallets,
    required this.selectedWallet,
    required this.onSelected,
    this.title = 'Select Wallet',
    this.subtitle,
    this.icon,
    this.showBalance = true,
  });

  /// Show the wallet selector as a modal bottom sheet
  static Future<FullWallet?> show(
    BuildContext context, {
    required List<FullWallet> wallets,
    FullWallet? selectedWallet,
    String title = 'Select Wallet',
    String? subtitle,
    IconData? icon,
    bool showBalance = true,
  }) {
    return showModalBottomSheet<FullWallet>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UniversalWalletSelector(
        wallets: wallets,
        selectedWallet: selectedWallet,
        onSelected: (wallet) => Navigator.pop(context, wallet),
        title: title,
        subtitle: subtitle,
        icon: icon,
        showBalance: showBalance,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon ?? HugeIcons.strokeRoundedWallet03,
                  color: HexColor(AppColors.primaryGreen),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Blacks.regularBoldCodeNext),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(subtitle!, style: Grays.tinyPoppinsHint),
                    ],
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(
                  HugeIcons.strokeRoundedCancel01,
                  color: Colors.grey.shade500,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Search hint
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: HexColor('#F5F7F6'),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  color: HexColor(AppColors.primaryGreen),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${wallets.length} wallet${wallets.length != 1 ? 's' : ''} available',
                    style: Grays.smallestPoppinsHint,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Wallets list
          Flexible(
            child: wallets.isEmpty
                ? _EmptyWallets()
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    itemCount: wallets.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final wallet = wallets[index];
                      final isSelected = selectedWallet?.id == wallet.id;
                      return _WalletCard(
                        wallet: wallet,
                        isSelected: isSelected,
                        showBalance: showBalance,
                        onTap: () => onSelected(wallet),
                      );
                    },
                  ),
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 10),
        ],
      ),
    );
  }
}

class _WalletCard extends StatelessWidget {
  final FullWallet wallet;
  final bool isSelected;
  final bool showBalance;
  final VoidCallback onTap;

  const _WalletCard({
    required this.wallet,
    required this.isSelected,
    required this.showBalance,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? HexColor(AppColors.primaryGreen).withAlpha(25)
              : HexColor('#F8FAF9'),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? HexColor(AppColors.primaryGreen)
                : HexColor('#E8ECE9'),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: HexColor(AppColors.primaryGreen).withAlpha(30),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          children: [
            // Wallet icon with gradient
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: (wallet.colors != null && wallet.colors!.isNotEmpty)
                      ? wallet.colors!.map((c) => HexColor(c)).toList()
                      : [
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
            // Wallet info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          wallet.name ?? wallet.purposeTag ?? 'Wallet',
                          style: Blacks.smallestBoldPoppins,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (wallet.isPrimary == true) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: HexColor(AppColors.primaryOrange).withAlpha(30),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'PRIMARY',
                            style: TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w700,
                              color: HexColor(AppColors.primaryOrange),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (showBalance) ...[
                    const SizedBox(height: 4),
                    Text(
                      'KSH ${formatThousands(amount: wallet.balance ?? 0, noDecimal: true)}',
                      style: Greens.smallBoldInter,
                    ),
                  ],
                ],
              ),
            ),
            // Selection indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              child: isSelected
                  ? Icon(
                      HugeIcons.strokeRoundedCheckmarkCircle01,
                      color: HexColor(AppColors.primaryGreen),
                      size: 24,
                    )
                  : Icon(
                      HugeIcons.strokeRoundedCircle,
                      color: HexColor('#D0D5D2'),
                      size: 24,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyWallets extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedWalletNotFound01,
              color: HexColor(AppColors.darkerGray2),
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          Text('No Wallets Found', style: Blacks.regularBoldCodeNext),
          const SizedBox(height: 6),
          Text(
            'Create a wallet to get started',
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, Routes.newWallet);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen),
                    HexColor(AppColors.fadedGreen),
                  ],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'Create Wallet',
                style: Whites.smallBoldRoboto,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

