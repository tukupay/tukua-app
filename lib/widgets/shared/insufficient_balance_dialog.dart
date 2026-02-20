import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Reusable dialog shown when wallet balance is insufficient
/// Provides options to:
/// 1. Change wallet - Opens wallet selector
/// 2. Top up wallet - Opens top up methods bottom sheet
class InsufficientBalanceDialog extends StatelessWidget {
  final FullWallet currentWallet;
  final double requiredAmount;
  final Function(FullWallet)? onWalletChanged;
  final VoidCallback? onTopUp;

  const InsufficientBalanceDialog({
    super.key,
    required this.currentWallet,
    required this.requiredAmount,
    this.onWalletChanged,
    this.onTopUp,
  });

  /// Show the dialog
  static Future<void> show({
    required BuildContext context,
    required FullWallet currentWallet,
    required double requiredAmount,
    Function(FullWallet)? onWalletChanged,
    VoidCallback? onTopUp,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black54,
      builder: (context) => InsufficientBalanceDialog(
        currentWallet: currentWallet,
        requiredAmount: requiredAmount,
        onWalletChanged: onWalletChanged,
        onTopUp: onTopUp,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shortage = requiredAmount - (currentWallet.balance ?? 0);

    return Dialog(
      backgroundColor: Colors.white,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        width: double.maxFinite,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header icon
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: HexColor('#FFF3E0'),
                shape: BoxShape.circle,
              ),
              child: Icon(
                HugeIcons.strokeRoundedWalletNotFound02,
                size: 28,
                color: HexColor('#FF6F00'),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              'Insufficient Balance',
              style: Blacks.mediumSemiRubik.copyWith(
                fontSize: 17,
                color: HexColor('#FF6F00'),
              ),
            ),
            const SizedBox(height: 16),

            // Wallet Info Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: HexColor('#F5F7F6'),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: HexColor('#E8ECE9')),
              ),
              child: Column(
                children: [
                  _buildInfoRow(
                    'Wallet',
                    currentWallet.name ?? currentWallet.purposeTag ?? 'Wallet',
                    'Balance',
                    'KSH ${formatThousands(amount: currentWallet.balance ?? 0, noDecimal: true)}',
                    balanceColor: HexColor('#FF6F00'),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Divider(height: 1, color: HexColor('#E0E3E1')),
                  ),
                  _buildInfoRow(
                    'Required',
                    'KSH ${formatThousands(amount: requiredAmount, noDecimal: true)}',
                    'Short by',
                    'KSH ${formatThousands(amount: shortage, noDecimal: true)}',
                    balanceColor: Colors.red,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons using existing widgets
            AltGreenButton(
              text: 'Change Wallet',
              icon: HugeIcons.strokeRoundedWallet03,
              tapped: () async {
                Navigator.pop(context);
                await _showWalletSelector(context);
              },
            ),
            const SizedBox(height: 12),

            // Top Up - using AuthButton style (outlined)
            GestureDetector(
              onTap: () {
                Navigator.pop(context);
                _showTopUpMethods(context);
              },
              child: Container(
                alignment: Alignment.center,
                height: 50,
                width: MediaQuery.of(context).size.width / 1.2,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: HexColor(AppColors.primaryGreen),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Top Up Wallet',
                      style: Blacks.regularSemiRoboto.copyWith(
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      HugeIcons.strokeRoundedArrowUpDouble,
                      color: HexColor(AppColors.primaryGreen),
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Cancel
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: Grays.smallRoboto,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Info row helper
  Widget _buildInfoRow(
    String leftLabel,
    String leftValue,
    String rightLabel,
    String rightValue, {
    Color? balanceColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(leftLabel, style: Grays.smallestPoppinsHint),
            const SizedBox(height: 2),
            Text(leftValue, style: Blacks.tinyBolderPoppins),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(rightLabel, style: Grays.smallestPoppinsHint),
            const SizedBox(height: 2),
            Text(
              rightValue,
              style: Blacks.tinyBolderPoppins.copyWith(color: balanceColor),
            ),
          ],
        ),
      ],
    );
  }

  /// Show wallet selector bottom sheet
  Future<void> _showWalletSelector(BuildContext context) async {
    final selectedWallet = await showModalBottomSheet<FullWallet>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => WalletSelectorSheet(
        currentWallet: currentWallet,
        showOnlyActive: true,
      ),
    );

    if (selectedWallet != null && onWalletChanged != null) {
      onWalletChanged!(selectedWallet);
    }
  }

  /// Show top up methods bottom sheet (same as instant_pay.dart)
  void _showTopUpMethods(BuildContext context) {
    final payments = Provider.of<PaymentsProvider>(context, listen: false);
    final walletProvider = Provider.of<WalletProvider>(context, listen: false);

    // Set the current wallet as selected for top up
    walletProvider.selectWallet(currentWallet);

    // Select wallet top up transaction type
    payments.selectType(
      payments.transactionTypes.firstWhere(
        (el) => el.type == Strings.walletTopUp,
      ),
    );

    // Show top up methods bottom sheet
    showModalBottomSheet(
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return DecoratedSheet(
          items: payments.paymentMethods.length + 1,
          height: 600,
          title: 'Select Top Up Method',
          body: TopUpMethods(),
        );
      },
    );

    // Call callback if provided
    if (onTopUp != null) {
      onTopUp!();
    }
  }
}

