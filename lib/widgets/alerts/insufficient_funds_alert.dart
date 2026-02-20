import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../widget.dart';

/// Reusable alert for insufficient wallet balance
/// Provides options to change wallet or top up
class InsufficientFundsAlert extends StatelessWidget {
  final FullWallet currentWallet;
  final double requiredAmount;
  final Function(FullWallet)? onWalletChanged;

  const InsufficientFundsAlert({
    super.key,
    required this.currentWallet,
    required this.requiredAmount,
    this.onWalletChanged,
  });

  @override
  Widget build(BuildContext context) {
    final balance = currentWallet.balance ?? 0.0;
    final shortfall = requiredAmount - balance;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(51),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    HexColor('#FFF8E1'),
                    HexColor('#FFECB3'),
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: HexColor('#FB8C00').withAlpha(38),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      HugeIcons.strokeRoundedAlert02,
                      color: HexColor('#F57C00'),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Insufficient Balance',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: HexColor('#E65100'),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Wallet balance too low',
                          style: TextStyle(
                            fontSize: 13,
                            color: HexColor('#757575'),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Current wallet info
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white,
                          HexColor('#F8FAF9'),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: HexColor('#E0E0E0'),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              HugeIcons.strokeRoundedWallet02,
                              size: 16,
                              color: HexColor('#757575'),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                currentWallet.name ?? 'Wallet ${currentWallet.id}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: HexColor('#212121'),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _buildAmountRow(
                          'Available',
                          balance,
                          HexColor('#757575'),
                        ),
                        const SizedBox(height: 6),
                        _buildAmountRow(
                          'Required',
                          requiredAmount,
                          HexColor('#FB8C00'),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 1,
                          color: HexColor('#E8ECE9'),
                        ),
                        const SizedBox(height: 6),
                        _buildAmountRow(
                          'Shortfall',
                          shortfall,
                          HexColor('#E53935'),
                          bold: true,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      // Change Wallet Button
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _showWalletSelector(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: HexColor(AppColors.primaryGreen),
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(26),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  HugeIcons.strokeRoundedExchange01,
                                  color: HexColor(AppColors.primaryGreen),
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Change Wallet',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(width: 14),

                      // Top Up Button
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _handleTopUp(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  HexColor(AppColors.primaryGreen),
                                  HexColor(AppColors.fadedGreen),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(51),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  HugeIcons.strokeRoundedArrowUpDouble,
                                  color: Colors.white,
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Top Up',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Cancel button
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          fontSize: 14,
                          color: HexColor('#757575'),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountRow(String label, double amount, Color color,
      {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: HexColor('#757575'),
          ),
        ),
        Text(
          'KES ${amount.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
            color: color,
          ),
        ),
      ],
    );
  }

  void _showWalletSelector(BuildContext context) async {
    final walletProvider = Provider.of<WalletProvider>(context, listen: false);

    final result = await UniversalWalletSelector.show(
      context,
      wallets: walletProvider.userWallets,
      selectedWallet: currentWallet,
      title: 'Select Different Wallet',
      subtitle: 'Choose a wallet with sufficient balance',
      showBalance: true,
    );

    if (result != null && context.mounted) {
      Navigator.pop(context); // Close the insufficient funds dialog
      onWalletChanged?.call(result);
    }
  }

  void _handleTopUp(BuildContext context) {
    // Close the insufficient funds dialog
    Navigator.pop(context);

    // Pre-select the current wallet in payments provider
    final paymentProvider = Provider.of<PaymentsProvider>(context, listen: false);
    paymentProvider.selectDestinationWallet(currentWallet);

    // Select wallet top-up transaction type
    paymentProvider.selectType(
      paymentProvider.transactionTypes.firstWhere(
        (el) => el.type == Strings.walletTopUp,
      ),
    );

    // Show top-up methods bottom sheet
    showModalBottomSheet(
      context: context,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      builder: (context) {
        return DecoratedSheet(
          items: paymentProvider.paymentMethods.length + 1,
          height: 600,
          title: 'Select Top Up Method',
          body: TopUpMethods(),
        );
      },
    );
  }

  /// Static method to show the dialog
  static Future<void> show({
    required BuildContext context,
    required FullWallet currentWallet,
    required double requiredAmount,
    Function(FullWallet)? onWalletChanged,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => InsufficientFundsAlert(
        currentWallet: currentWallet,
        requiredAmount: requiredAmount,
        onWalletChanged: onWalletChanged,
      ),
    );
  }
}

