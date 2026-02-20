import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/shared/universal_bank_selector.dart';

/// Compact card that displays selected bank and opens selector sheet on tap
/// Works with bank names (String), AvailableBank, or FullBank
class BankSelectorCard extends StatelessWidget {
  final String? selectedBankName;
  final List<AvailableBank> availableBanks;
  final ValueChanged<String> onSelected;
  final String label;
  final String? sheetTitle;
  final String? sheetSubtitle;

  const BankSelectorCard({
    super.key,
    required this.selectedBankName,
    required this.availableBanks,
    required this.onSelected,
    this.label = 'Select Bank',
    this.sheetTitle,
    this.sheetSubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedBankName != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: [
            Icon(
              HugeIcons.strokeRoundedBank,
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
          onTap: () async {
            final bankNames = availableBanks.map((b) => b.name).toList();
            final result = await UniversalBankSelector.showBankNames(
              context,
              bankNames: bankNames,
              selectedBank: selectedBankName,
              title: sheetTitle ?? label,
              subtitle: sheetSubtitle ?? 'Choose the recipient bank',
            );
            if (result != null) {
              onSelected(result);
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: hasSelection ? Colors.white : HexColor('#F8FAF9'),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen).withAlpha(100)
                    : HexColor('#E0E5E2'),
                width: hasSelection ? 1.5 : 1,
              ),
              boxShadow: hasSelection
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
                ? _SelectedContent(bankName: selectedBankName!)
                : const _PlaceholderContent(),
          ),
        ),
      ],
    );
  }
}

class _SelectedContent extends StatelessWidget {
  final String bankName;

  const _SelectedContent({required this.bankName});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Bank icon
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                HexColor(AppColors.primaryGreen),
                HexColor(AppColors.fadedGreen),
              ],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            HugeIcons.strokeRoundedBank,
            color: Colors.white,
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        // Bank info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bankName,
                style: Blacks.smallestBoldPoppins,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                'Tap to change',
                style: Grays.tinyPoppinsHint,
              ),
            ],
          ),
        ),
        // Chevron
        Icon(
          HugeIcons.strokeRoundedArrowDown01,
          color: HexColor(AppColors.primaryGreen),
          size: 18,
        ),
      ],
    );
  }
}

class _PlaceholderContent extends StatelessWidget {
  const _PlaceholderContent();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Icon
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: HexColor('#E8F5E9'),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            HugeIcons.strokeRoundedBank,
            color: HexColor(AppColors.primaryGreen).withAlpha(150),
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        // Text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select a bank',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 2),
              Text(
                'Tap to choose',
                style: Grays.tinyPoppinsHint,
              ),
            ],
          ),
        ),
        // Chevron
        Icon(
          HugeIcons.strokeRoundedArrowDown01,
          color: Colors.grey.shade400,
          size: 18,
        ),
      ],
    );
  }
}

/// A variant for selecting from user's saved banks (FullBank)
class UserBankSelectorCard extends StatelessWidget {
  final FullBank? selectedBank;
  final List<FullBank> userBanks;
  final ValueChanged<FullBank> onSelected;
  final String label;
  final String? sheetTitle;
  final String? sheetSubtitle;

  const UserBankSelectorCard({
    super.key,
    required this.selectedBank,
    required this.userBanks,
    required this.onSelected,
    this.label = 'Select Bank Account',
    this.sheetTitle,
    this.sheetSubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedBank != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: [
            Icon(
              HugeIcons.strokeRoundedBank,
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
          onTap: () async {
            final result = await UniversalBankSelector.showUserBanks(
              context,
              banks: userBanks,
              selectedBank: selectedBank,
              title: sheetTitle ?? label,
              subtitle: sheetSubtitle ?? 'Choose from your saved bank accounts',
            );
            if (result != null) {
              onSelected(result);
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: hasSelection ? Colors.white : HexColor('#F8FAF9'),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: hasSelection
                    ? HexColor(AppColors.primaryGreen).withAlpha(100)
                    : HexColor('#E0E5E2'),
                width: hasSelection ? 1.5 : 1,
              ),
              boxShadow: hasSelection
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
                ? _UserBankSelectedContent(bank: selectedBank!)
                : const _UserBankPlaceholderContent(),
          ),
        ),
      ],
    );
  }
}

class _UserBankSelectedContent extends StatelessWidget {
  final FullBank bank;

  const _UserBankSelectedContent({required this.bank});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Bank icon
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                HexColor(AppColors.primaryGreen),
                HexColor(AppColors.fadedGreen),
              ],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            HugeIcons.strokeRoundedBank,
            color: Colors.white,
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        // Bank info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bank.bankName ?? 'Bank Account',
                style: Blacks.smallestBoldPoppins,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                bank.maskedAccountNumber ?? bank.accountNumber ?? 'Tap to change',
                style: Grays.tinyPoppinsHint,
              ),
            ],
          ),
        ),
        // Chevron
        Icon(
          HugeIcons.strokeRoundedArrowDown01,
          color: HexColor(AppColors.primaryGreen),
          size: 18,
        ),
      ],
    );
  }
}

class _UserBankPlaceholderContent extends StatelessWidget {
  const _UserBankPlaceholderContent();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Icon
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: HexColor('#E8F5E9'),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            HugeIcons.strokeRoundedBank,
            color: HexColor(AppColors.primaryGreen).withAlpha(150),
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        // Text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select bank account',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 2),
              Text(
                'Tap to choose from saved banks',
                style: Grays.tinyPoppinsHint,
              ),
            ],
          ),
        ),
        // Chevron
        Icon(
          HugeIcons.strokeRoundedArrowDown01,
          color: Colors.grey.shade400,
          size: 18,
        ),
      ],
    );
  }
}

