import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/shared/universal_wallet_selector.dart';

/// Compact card that displays selected wallet and opens selector sheet on tap
class WalletSelectorCard extends StatelessWidget {
  final FullWallet? selectedWallet;
  final List<FullWallet> wallets;
  final ValueChanged<FullWallet> onSelected;
  final String label;
  final String? sheetTitle;
  final String? sheetSubtitle;
  final bool showBalance;
  final bool isSource; // true = sending from, false = receiving to
  final bool enabled;

  const WalletSelectorCard({
    super.key,
    required this.selectedWallet,
    required this.wallets,
    required this.onSelected,
    this.label = 'Select Wallet',
    this.sheetTitle,
    this.sheetSubtitle,
    this.showBalance = true,
    this.isSource = false,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedWallet != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: [
            Icon(
              isSource
                  ? HugeIcons.strokeRoundedWalletRemove01
                  : HugeIcons.strokeRoundedWalletAdd01,
              size: 14,
              color: HexColor(AppColors.primaryGreen),
            ),
            const SizedBox(width: 6),
            Text(label, style: Grays.smallestBolderPoppinsHint),
          ],
        ),
        const SizedBox(height: 8),
        // Card
        GestureDetector(
          onTap: enabled
              ? () async {
                  final result = await UniversalWalletSelector.show(
                    context,
                    wallets: wallets,
                    selectedWallet: selectedWallet,
                    title: sheetTitle ?? label,
                    subtitle: sheetSubtitle,
                    showBalance: showBalance,
                  );
                  if (result != null) {
                    onSelected(result);
                  }
                }
              : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: enabled
                  ? (hasSelection ? Colors.white : HexColor('#F8FAF9'))
                  : HexColor('#F0F2F1'),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen).withAlpha(100)
                    : HexColor('#E0E5E2'),
                width: hasSelection ? 1.5 : 1,
              ),
              boxShadow: hasSelection && enabled
                  ? [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ]
                  : null,
            ),
            child: hasSelection
                ? _SelectedContent(
                    wallet: selectedWallet!,
                    showBalance: showBalance,
                    isSource: isSource,
                    enabled: enabled,
                  )
                : _PlaceholderContent(isSource: isSource),
          ),
        ),
      ],
    );
  }
}

class _SelectedContent extends StatelessWidget {
  final FullWallet wallet;
  final bool showBalance;
  final bool isSource;
  final bool enabled;

  const _SelectedContent({
    required this.wallet,
    required this.showBalance,
    required this.isSource,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Wallet icon
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
          child: Icon(
            isSource
                ? HugeIcons.strokeRoundedWalletRemove01
                : HugeIcons.strokeRoundedWalletAdd01,
            color: Colors.white,
            size: 18,
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
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryOrange).withAlpha(25),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'PRIMARY',
                        style: TextStyle(
                          fontSize: 7,
                          fontWeight: FontWeight.w700,
                          color: HexColor(AppColors.primaryOrange),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (showBalance) ...[
                const SizedBox(height: 2),
                Text(
                  'KSH ${formatThousands(amount: wallet.balance ?? 0, noDecimal: true)}',
                  style: Greens.smallBoldInter.copyWith(fontSize: 12),
                ),
              ],
            ],
          ),
        ),
        // Change indicator
        if(enabled)...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Change',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: HexColor(AppColors.primaryGreen),
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  HugeIcons.strokeRoundedArrowDown01,
                  size: 14,
                  color: HexColor(AppColors.primaryGreen),
                ),
              ],
            ),
          ),
        ]
      ],
    );
  }
}

class _PlaceholderContent extends StatelessWidget {
  final bool isSource;

  const _PlaceholderContent({required this.isSource});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Icon placeholder
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: HexColor('#E8ECE9'),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isSource
                ? HugeIcons.strokeRoundedWalletRemove01
                : HugeIcons.strokeRoundedWalletAdd01,
            color: Colors.grey.shade500,
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        // Placeholder text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tap to select wallet',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 2),
              Text(
                isSource ? 'Choose source wallet' : 'Choose destination wallet',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade400,
                ),
              ),
            ],
          ),
        ),
        // Arrow indicator
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: HexColor('#F5F7F6'),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            HugeIcons.strokeRoundedArrowDown01,
            size: 16,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    );
  }
}

