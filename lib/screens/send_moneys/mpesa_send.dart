import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';

class MpesaSend extends StatefulWidget {
  const MpesaSend({super.key});

  @override
  State<MpesaSend> createState() => _MpesaSendState();
}

class _MpesaSendState extends State<MpesaSend> {
  final phoneController = TextEditingController();
  final amountController = TextEditingController();
  bool _insufficientBalance = false;

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
      if (payments.selectedSourceWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: true, isDestination: false);
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

            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : WalletSelectorCard(
                    selectedWallet: payments.selectedSourceWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectSourceWallet(wallet);
                    },
                    label: 'Select source wallet',
                    sheetTitle: 'Source Wallet',
                    sheetSubtitle: 'Funds will be deducted from this wallet',
                    isSource: true,
                  ),

            const SizedBox(height: 24),

            // Favourite contacts
            FavouriteContacts(
              onContactSelected: (contact) {
                if (contact.phone != null && contact.phone!.isNotEmpty) {
                  phoneController.text = convertToLocalKenyanFormat(contact.phone!)!;
                }
              },
            ),

            const SizedBox(height: 24),


            // Phone input
            LabeledField(
                label: 'Phone Number',
                hint: '0701234567',
                enabled: true,
                controller: phoneController,
                showOwner: true,
                isNumber: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedCall,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 16),

            // Amount input
            LabeledField(
                label: 'Amount (KSH)',
                hint: '0',
                isNumber: true,
                controller: amountController,
                enabled: true,
                hasError: _insufficientBalance,
                errorText: _insufficientBalance ? 'Insufficient balance in selected wallet' : null,
                changed: (val) {
                  final amount = double.tryParse(val ?? '') ?? 0;
                  final balance = payments.selectedSourceWallet?.balance ?? 0;
                  setState(() {
                    _insufficientBalance = amount > 0 && balance < amount;
                  });
                },
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: _insufficientBalance ? const Color(0xFFE53935) : HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),

            const SizedBox(height: 32),

            // Proceed button
            Center(
              child: AuthButton(
                text: 'Send Money',
                tapped: () => _handleProceed(payments, profile),
              ),
            ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'Recipient will receive funds directly to their M-Pesa account',
            ),
          ],
        );
      },
    );
  }

  void _handleProceed(PaymentsProvider payments, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payments.selectedSourceWallet == null) {
      Fluttertoast.showToast(msg: "Select which wallet you plan to send from");
      return;
    }
    if (phoneController.text.isEmpty || phoneController.text.length != 10) {
      Fluttertoast.showToast(msg: "Please enter a 10 digit phone number");
      return;
    }
    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an amount");
      return;
    }
    if ((payments.selectedSourceWallet?.balance ?? 0) < double.parse(amountController.text)) {
      setState(() => _insufficientBalance = true);
      Fluttertoast.showToast(msg: "Insufficient balance in selected wallet");
      return;
    }

    final paymentRequest = PaymentRequest(
      transactionData: TransactionData(
        transactionType: payments.selectedType?.type ?? Strings.userTransfer,
        amount: double.parse(amountController.text),
        destinationPhone: phoneController.text,
        transferMethod: payments.selectedMethod!.method,
      ),
      paymentSource: PaymentSource(
        paymentMethod: Strings.tuku,
        sourceWalletId: payments.selectedSourceWallet!.id,
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
  }
}
