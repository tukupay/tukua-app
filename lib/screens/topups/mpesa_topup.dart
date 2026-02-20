import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/widget.dart';

class MpesaTopUp extends StatefulWidget {
  const MpesaTopUp({super.key});

  @override
  State<MpesaTopUp> createState() => _MpesaTopUpState();
}

class _MpesaTopUpState extends State<MpesaTopUp> {
  final phoneController = TextEditingController();
  final amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
      if (profileProvider.user?.phoneNumber != null) {
        phoneController.text = convertToLocalKenyanFormat(profileProvider.user!.phoneNumber ?? '')!;
      }

      // Auto-select primary wallet if available
      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);
      if (payments.selectedDestinationWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: false, isDestination: true);
      }
    });
  }

  @override
  void dispose() {
    phoneController.dispose();
    amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<PaymentsProvider, WalletProvider, ProfileProvider>(
      builder: (_, payments, wallets, profile, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wallet selector
            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : WalletSelectorCard(
                    selectedWallet: payments.selectedDestinationWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectDestinationWallet(wallet);
                    },
                    label: 'Select wallet to top up',
                    sheetTitle: 'Top Up Wallet',
                    sheetSubtitle: 'Select destination for your funds',
                    isSource: false,
                  ),

            const SizedBox(height: 24),

            // Phone input card
            LabeledField(
                label: 'Phone Number',
                hint: '0701234567',
                controller: phoneController,
                enabled: true,
                canGoNext: true,
                isNumber: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedCall,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 16),

            // Amount input card
            LabeledField(
                label: 'Amount (KSH)',
                hint: '500',
                controller: amountController,
                isNumber: true,
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 32),

            // Proceed button
            Center(
              child: AuthButton(
                text: 'PROCEED TO PAY',
                tapped: () => _handleProceed(payments, profile),
              ),
            ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'You will receive an M-Pesa prompt on your phone to complete the payment',
            ),
          ],
        );
      },
    );
  }

  void _handleProceed(PaymentsProvider payments, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payments.selectedDestinationWallet == null) {
      Fluttertoast.showToast(msg: "Select which wallet you plan to top up");
      return;
    }
    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter an amount");
      return;
    }
    if (phoneController.text.isEmpty || phoneController.text.length != 10) {
      Fluttertoast.showToast(msg: "Enter a 10-digit phone number");
      return;
    }

    final paymentRequest = PaymentRequest(
      transactionData: TransactionData(
        transactionType: payments.selectedType?.type ?? Strings.walletTopUp,
        destinationWalletId: payments.selectedDestinationWallet!.id,
        amount: double.parse(amountController.text.trim()),
      ),
      paymentSource: PaymentSource(
        paymentMethod: payments.selectedMethod!.method,
        phoneNumber: phoneController.text.trim(),
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
  }
}