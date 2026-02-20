import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/widget.dart';
import '../../services/services.dart';

class CardTopUp extends StatefulWidget {
  const CardTopUp({super.key});

  @override
  State<CardTopUp> createState() => _CardTopUpState();
}

class _CardTopUpState extends State<CardTopUp> {
  final cardNameController = TextEditingController();
  final cardNumberController = TextEditingController();
  final expiryDateController = TextEditingController();
  final securityCodeController = TextEditingController();
  final amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final wallets = Provider.of<WalletProvider>(context, listen: false);
      final payments = Provider.of<PaymentsProvider>(context, listen: false);
      if (payments.selectedDestinationWallet == null && wallets.userWallets.isNotEmpty) {
        payments.autoSelectPrimaryWallet(wallets.userWallets, isSource: false, isDestination: true);
      }
    });
  }

  @override
  void dispose() {
    cardNameController.dispose();
    cardNumberController.dispose();
    expiryDateController.dispose();
    securityCodeController.dispose();
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
                    selectedWallet: payments.selectedDestinationWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectDestinationWallet(wallet);
                    },
                    label: 'Select destination wallet',
                    sheetTitle: 'Top Up Wallet',
                    sheetSubtitle: 'Where funds will be deposited',
                    isSource: false,
                  ),

            const SizedBox(height: 24),

            // Card name
            LabeledField(
                controller: cardNameController,
                label: 'Name on Card',
                hint: 'eg PETER GRIFFIN',
                canGoNext: true,
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedUser,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
            const SizedBox(height: 12),

            // Card number
            LabeledField(
                label: 'Card Number',
                hint: '0000 0000 0000 0000',
                controller: cardNumberController,
                canGoNext: true,
                isNumber: true,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  CardNumberFormatter(),
                ],
                enabled: true,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedCreditCard,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
            const SizedBox(height: 12),

            // Expiry and CVV row
            Row(
              children: [
                Expanded(
                  child: LabeledField(
                      label: 'Expiry Date',
                      hint: 'MM/YYYY',
                      controller: expiryDateController,
                      canGoNext: true,
                      isNumber: true,
                      enabled: true,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        ExpiryDateFormatter(),
                      ],
                      prefixIcon: Icon(
                        HugeIcons.strokeRoundedCalendar03,
                        color: HexColor(AppColors.primaryGreen),
                        size: 18,
                      ),
                    ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LabeledField(
                      label: 'CVV',
                      hint: '***',
                      canGoNext: true,
                      controller: securityCodeController,
                      isNumber: true,
                      enabled: true,
                      prefixIcon: Icon(
                        HugeIcons.strokeRoundedLockPassword,
                        color: HexColor(AppColors.primaryGreen),
                        size: 18,
                      ),
                    ),
                ),
              ],
            ),

            const SizedBox(height: 24),

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
                text: 'TOP UP WITH CARD',
                tapped: () => _handleProceed(payments, profile),
              ),
            ),

            const SizedBox(height: 16),

            // Info note
            InfoNote(
              text: 'Your card details are encrypted and securely processed',
            ),
          ],
        );
      },
    );
  }

  void _handleProceed(PaymentsProvider payments, ProfileProvider profile) async {
    Fluttertoast.cancel();

    if (payments.selectedDestinationWallet == null) {
      Fluttertoast.showToast(msg: "Pick the wallet you wish to top up");
      return;
    }
    if (cardNameController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter the name on the card");
      return;
    }
    if (cardNumberController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter the card number");
      return;
    }
    if (cardNumberController.text.replaceAll(" ", "").length != 16) {
      Fluttertoast.showToast(msg: "Enter a 16-digit card number");
      return;
    }
    if (expiryDateController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter the expiry date");
      return;
    }
    if (securityCodeController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter the security code");
      return;
    }
    if (securityCodeController.text.length != 3) {
      Fluttertoast.showToast(msg: "Enter a 3-digit security code");
      return;
    }
    if (amountController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Enter an amount");
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
        cardName: cardNameController.text,
        cardNumber: cardNumberController.text.replaceAll(" ", ""),
        expiryMonth: int.parse(expiryDateController.text.split('/')[0]),
        expiryYear: int.parse(expiryDateController.text.split('/')[1]),
        cvv: securityCodeController.text,
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
  }
}

