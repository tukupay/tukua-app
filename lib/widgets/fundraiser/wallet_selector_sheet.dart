import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

/// Bottom sheet for selecting wallet to collect fundraiser donations
/// Supports both FullWallet and WalletSnippet
class FundraiserWalletSelectorSheet extends StatelessWidget {
  final List<WalletSnippet> wallets;
  final WalletSnippet? selectedWallet;
  final ValueChanged<WalletSnippet> onSelected;

  const FundraiserWalletSelectorSheet({
    super.key,
    required this.wallets,
    required this.selectedWallet,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Collection Wallet', style: Blacks.regularBoldCodeNext),
                    const SizedBox(height: 2),
                    Text(
                      'Where donations will be collected',
                      style: Grays.tinyPoppinsHint,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Wallets list
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: wallets.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final wallet = wallets[index];
              final isSelected = selectedWallet?.id == wallet.id;
              final isActive = wallet.isActive;

              return GestureDetector(
                onTap: () {
                  if (!isActive) {
                    // Optionally show a toast that inactive wallets can't be selected
                    return;
                  }
                  onSelected(wallet);
                  Navigator.pop(context);
                },
                child: Opacity(
                  opacity: isActive ? 1.0 : 0.5,
                  child: Container(
                    padding: const EdgeInsets.all(14),
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
                          child: Icon(
                            wallet.isLinkedToBank
                                ? HugeIcons.strokeRoundedBank
                                : HugeIcons.strokeRoundedWallet02,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      wallet.name.isNotEmpty
                                          ? wallet.name
                                          : 'Wallet ${wallet.id}',
                                      style: Blacks.smallestBoldPoppins,
                                    ),
                                  ),
                                  if (!isActive)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: HexColor('#FFF3E0'),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'Inactive',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w600,
                                          color: HexColor('#FB8C00'),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              if (wallet.isLinkedToBank)
                                Text(
                                  'Bank Linked',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Icon(
                            HugeIcons.strokeRoundedCheckmarkCircle01,
                            color: HexColor(AppColors.primaryGreen),
                            size: 22,
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
        ],
      ),
    );
  }
}

