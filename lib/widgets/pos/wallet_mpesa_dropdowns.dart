import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Wallet selection dropdown for POS - Read-only by default
/// Wallet can only be changed in POS Settings
class WalletMpesaDropdowns extends StatefulWidget {
  final bool enabled;

  const WalletMpesaDropdowns({
    super.key,
    this.enabled = false, // Read-only by default - changeable only in POS Settings
  });

  @override
  State<WalletMpesaDropdowns> createState() => _WalletMpesaDropdownsState();
}

class _WalletMpesaDropdownsState extends State<WalletMpesaDropdowns> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Auto-select primary wallet if available
      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);
      if (payments.selectedDestinationWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: false, isDestination: true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<WalletProvider, PaymentsProvider>(
      builder: (_, walletProvider, payments, __) {
        if (walletProvider.userWallets.isEmpty) {
          return const EmptyAccountsHint();
        }
        return WalletSelectorCard(
          selectedWallet: payments.selectedDestinationWallet,
          wallets: walletProvider.userWallets,
          onSelected: widget.enabled
              ? (wallet) {
                  Provider.of<PaymentsProvider>(context, listen: false)
                      .selectDestinationWallet(wallet);
                }
              : (wallet) {
                  // Do nothing - wallet is read-only
                },
          label: 'Source Wallet',
          sheetTitle: 'Select Source Wallet',
          sheetSubtitle: 'Where payments will be deducted from',
          isSource: false,
          enabled: widget.enabled,
        );
      },
    );
  }

}
