import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

/// Reusable bottom sheet for selecting a wallet
class WalletSelectorSheet extends StatelessWidget {
  final FullWallet? currentWallet;
  final bool showOnlyActive;
  final double? minBalance;

  const WalletSelectorSheet({
    super.key,
    this.currentWallet,
    this.showOnlyActive = true,
    this.minBalance,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
        border: Border(
          top: BorderSide(
            color: HexColor(AppColors.primaryGreen).withAlpha(51),
            width: 2,
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: HexColor(AppColors.lightGray),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: HexColor('#E8F5E9'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedWallet03,
                    size: 20,
                    color: HexColor(AppColors.primaryGreen),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Wallet',
                        style: Blacks.mediumSemiRubik,
                      ),
                      Text(
                        'Choose a wallet to continue',
                        style: Grays.smallestPoppinsHint,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    HugeIcons.strokeRoundedCancel01,
                    color: HexColor(AppColors.darkerGray2),
                    size: 20,
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Wallets List
          Flexible(
            child: Consumer<WalletProvider>(
              builder: (context, walletProvider, _) {
                final wallets = _filterWallets(walletProvider.userWallets);

                if (wallets.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
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
                              size: 40,
                              color: HexColor(AppColors.darkerGray2),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            minBalance != null
                                ? 'No Eligible Wallets'
                                : 'No Wallets Found',
                            style: Blacks.regularBoldCodeNext,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            minBalance != null
                                ? 'No wallets with sufficient balance'
                                : 'Create a wallet to get started',
                            style: Grays.smallestPoppinsHint,
                            textAlign: TextAlign.center,
                          ),
                          if (minBalance == null) ...[
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
                        ],
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  shrinkWrap: true,
                  itemCount: wallets.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final wallet = wallets[index];
                    final isSelected = currentWallet?.id == wallet.id;
                    final isInsufficientBalance = minBalance != null &&
                                                  (wallet.balance??0) < minBalance!;

                    return GestureDetector(
                      onTap: isInsufficientBalance
                          ? null
                          : () => Navigator.pop(context, wallet),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          // gradient: isSelected
                          //     ? LinearGradient(
                          //         begin: Alignment.topLeft,
                          //         end: Alignment.bottomRight,
                          //         colors: [
                          //           HexColor(AppColors.primaryGreen).withAlpha(26),
                          //           HexColor(AppColors.fadedGreen).withAlpha(26),
                          //         ],
                          //       )
                          //     : null,
                          color: isSelected ? null : Colors.white,
                          border: Border.all(
                            color: isSelected
                                ? HexColor(AppColors.primaryGreen)
                                : HexColor(AppColors.lightGray),
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(10),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Wallet Icon
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: wallet.colors!.map((color)=>HexColor(color)).toList(),
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                HugeIcons.strokeRoundedWallet02,
                                size: 20,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Wallet Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          wallet.name ??
                                          wallet.purposeTag ??
                                          'Wallet',
                                          style: Blacks.tinyBolderPoppins,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (wallet.isPrimary==true) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: HexColor(AppColors.primaryGreen),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            'PRIMARY',
                                            style: Whites.tinyPoppins.copyWith(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        'KSH ${formatThousands(amount: (wallet.balance??0), noDecimal: true)}',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: isInsufficientBalance
                                              ? Colors.red
                                              : HexColor(AppColors.primaryGreen),
                                        ),
                                      ),
                                      if (isInsufficientBalance) ...[
                                        const SizedBox(width: 6),
                                        Icon(
                                          HugeIcons.strokeRoundedAlertCircle,
                                          size: 14,
                                          color: Colors.red,
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            // Selection Indicator
                            if (isSelected)
                              Icon(
                                HugeIcons.strokeRoundedCheckmarkCircle02,
                                color: HexColor(AppColors.primaryGreen),
                                size: 24,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Filter wallets based on criteria
  List<FullWallet> _filterWallets(List<FullWallet> wallets) {
    return wallets.where((wallet) {
      // Filter by active status
      if (showOnlyActive && wallet.isActive!=true) {
        return false;
      }

      // Filter by minimum balance
      if (minBalance != null && (wallet.balance??0) < minBalance!) {
        return false;
      }

      return true;
    }).toList();
  }
}

