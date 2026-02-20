import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';

import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../widget.dart';

/// POS payment input form - Phone number, amount, and wallet selection
class PosInputs extends StatefulWidget {
  const PosInputs({super.key});

  @override
  State<PosInputs> createState() => _PosInputsState();
}

class _PosInputsState extends State<PosInputs> {
  final phoneController = TextEditingController();
  final amountController = TextEditingController();

  @override
  void dispose() {
    phoneController.dispose();
    amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<PosProvider, PaymentsProvider, ProfileProvider>(
      builder: (_, pos, payments, profile, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wallet selector (read-only - changeable in settings)
            _buildWalletSection(),
            const SizedBox(height: 16),
            // Phone input
            _buildPhoneInput(),
            const SizedBox(height: 16),
            // Amount input and send button
            _buildAmountRow(pos, payments, profile),
            const SizedBox(height: 14),
            // Bank charges checkbox
            _buildBankChargesOption(pos),
          ],
        );
      },
    );
  }

  Widget _buildWalletSection() {
    return Consumer3<WalletProvider, PaymentsProvider, ProfileProvider>(
      builder: (_, wallets, payments, profile, __) {
        if (wallets.userWallets.isEmpty) {
          return const EmptyAccountsHint();
        }

        // Auto-select POS wallet from profile if set, otherwise use first wallet
        final posWalletId = profile.user?.posWalletId;
        FullWallet? selectedWallet = payments.selectedDestinationWallet;

        // If no wallet selected yet, try to find saved POS wallet
        if (selectedWallet == null && posWalletId != null) {
          selectedWallet = wallets.userWallets.firstWhere(
            (w) => w.id == posWalletId,
            orElse: () => wallets.userWallets.first,
          );
          // Set it in payments provider for consistency
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Provider.of<PaymentsProvider>(context, listen: false)
                .selectDestinationWallet(selectedWallet!);
          });
        } else if (selectedWallet == null && wallets.userWallets.isNotEmpty) {
          // Fallback to first wallet if no POS wallet set
          selectedWallet = wallets.userWallets.first;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Provider.of<PaymentsProvider>(context, listen: false)
                .selectDestinationWallet(selectedWallet!);
          });
        }

        return WalletSelectorCard(
          selectedWallet: selectedWallet,
          wallets: wallets.userWallets,
          onSelected: (wallet) {
            // This won't be called since enabled is false
          },
          label: 'Recipient Wallet',
          sheetTitle: 'Select Recipient Wallet',
          sheetSubtitle: 'Where payments will be deposited',
          isSource: false,
          enabled: false, // Read-only in POS - change in settings
        );
      },
    );
  }


  Widget _buildPhoneInput() {
    return LabeledField(
      label: 'Customer Phone Number',
      prefixIcon: Icon(
        HugeIcons.strokeRoundedCall,
        size: 18,
        color: HexColor(AppColors.primaryGreen),
      ),
      hint: '07XX XXX XXX',
      controller: phoneController,
      isNumber: true,
      canGoNext: true,
      enabled: true,
    );
  }

  Widget _buildAmountRow(PosProvider pos, PaymentsProvider payments, ProfileProvider profile) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          flex: 3,
          child: LabeledField(
            label: 'Amount (KES)',
            isNumber: true,
            hint: '0.00',
            controller: amountController,
            enabled: true,
            prefixIcon: Icon(
              HugeIcons.strokeRoundedMoney03,
              size: 18,
              color: HexColor(AppColors.primaryGreen),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: () => _onSendPayment(payments, profile),
              style: ElevatedButton.styleFrom(
                backgroundColor: HexColor(AppColors.primaryGreen),
                foregroundColor: Colors.white,
                elevation: 2,
                shadowColor: HexColor(AppColors.primaryGreen).withAlpha(40),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(HugeIcons.strokeRoundedSent, size: 18),
                  const SizedBox(width: 6),
                  const Text(
                    'SEND',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Inter',
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBankChargesOption(PosProvider pos) {
    return GestureDetector(
      onTap: () {
        Provider.of<PosProvider>(context, listen: false)
            .changeIncludeWithdraw(!pos.includeWithdrawal);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: pos.includeWithdrawal
              ? HexColor(AppColors.primaryGreen).withAlpha(8)
              : HexColor('#F8F9F8'),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: pos.includeWithdrawal
                ? HexColor(AppColors.primaryGreen).withAlpha(25)
                : HexColor('#E8EBE9'),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: pos.includeWithdrawal
                    ? HexColor(AppColors.primaryGreen)
                    : Colors.white,
                borderRadius: BorderRadius.circular(5),
                border: Border.all(
                  color: pos.includeWithdrawal
                      ? HexColor(AppColors.primaryGreen)
                      : HexColor('#D5D7DE'),
                  width: 1.5,
                ),
              ),
              child: pos.includeWithdrawal
                  ? const Icon(
                      Icons.check,
                      size: 14,
                      color: Colors.white,
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Include Bank Charges',
                style: Blacks.smallestBoldPoppins,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withAlpha(12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'KES 30.00',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: HexColor(AppColors.primaryGreen),
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onSendPayment(PaymentsProvider payments, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payments.selectedDestinationWallet == null) {
      Fluttertoast.showToast(msg: "Select the wallet to receive funds");
      return;
    }

    if (phoneController.text.length != 10) {
      Fluttertoast.showToast(msg: "Please enter a valid 10-digit phone number");
      return;
    }

    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an amount");
      return;
    }

    final amount = double.tryParse(amountController.text.trim());
    if (amount == null || amount <= 0) {
      Fluttertoast.showToast(msg: "Please enter a valid amount");
      return;
    }

    final request = PaymentRequest(
      transactionData: TransactionData(
        transactionType: Strings.posPayment,
        destinationWalletId: payments.selectedDestinationWallet!.id,
        amount: amount,
        businessName: profile.user?.businessName ?? profile.user?.username,
      ),
      paymentSource: PaymentSource(
        paymentMethod: Strings.mpesa,
        phoneNumber: phoneController.text.trim(),
      ),
    );

    payments.setPendingRequest(request);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
  }
}
