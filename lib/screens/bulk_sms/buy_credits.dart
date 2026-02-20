import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';

import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

class BuyCredits extends StatefulWidget {
  const BuyCredits({super.key});

  @override
  State<BuyCredits> createState() => _BuyCreditsState();
}

class _BuyCreditsState extends State<BuyCredits> {
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cardNameController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _expiryDateController = TextEditingController();
  final _securityCodeController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _phoneController.dispose();
    _cardNameController.dispose();
    _cardNumberController.dispose();
    _expiryDateController.dispose();
    _securityCodeController.dispose();
    super.dispose();
  }

  void _calculateCost() {
    if (_amountController.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: "Please enter an amount");
    } else {
      Provider.of<CreditsProvider>(context, listen: false)
          .getCreditPricing(int.parse(_amountController.text));
    }
  }

  void _handleTopUp() {
    final payments = Provider.of<PaymentsProvider>(context, listen: false);
    if (payments.selectedMethod == null) {
      Fluttertoast.showToast(msg: "Please select a payment method");
      return;
    }

    final credits = Provider.of<CreditsProvider>(context, listen: false);
    final transactionData = TransactionData(
      transactionType: payments.selectedType!.type,
      amount: credits.creditPricing?.amount ?? 0,
    );
    final metadata = {
      "sms_count": credits.creditPricing?.smsCount,
      "tier_id": credits.creditPricing?.tierInfo?.id,
      "min_volume": credits.creditPricing?.tierInfo?.minVolume,
      "max_volume": credits.creditPricing?.tierInfo?.maxVolume,
      "cost_per_sms": credits.creditPricing?.tierInfo?.costPerSms,
      "markup_percentage": credits.creditPricing?.tierInfo?.markupPercentage,
      "selling_price_per_sms": credits.creditPricing?.tierInfo?.sellingPricePerSms,
      "is_active": credits.creditPricing?.tierInfo?.isActive,
    };

    Fluttertoast.cancel();
    Navigator.pushNamed(context, Routes.smsTopUp);
  }

  void _showMpesaPaymentSheet(
      TransactionData transactionData, Map<String, dynamic> metadata) {
    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: DecoratedSheet(
            hasCounter: false,
            title: "Pay via M-Pesa",
            body: MpesaNumber(
              phoneController: _phoneController,
              tapped: () {
                if (_phoneController.text.trim().isEmpty) {
                  Fluttertoast.showToast(msg: "Please enter a phone number");
                } else if (_phoneController.text.trim().length != 10) {
                  Fluttertoast.showToast(
                      msg: "Please enter a valid 10-digit phone number");
                } else {
                  _processPayment(
                    PaymentRequest(
                      transactionData: transactionData,
                      paymentSource: PaymentSource(
                        phoneNumber: _phoneController.text.trim(),
                        paymentMethod:
                            Provider.of<PaymentsProvider>(context, listen: false)
                                .selectedMethod!
                                .method,
                      ),
                      metadata: metadata,
                    ),
                  );
                }
              },
            ),
            height: 450,
          ),
        );
      },
    );
  }

  void _showCardPaymentSheet(
      TransactionData transactionData, Map<String, dynamic> metadata) {
    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: DecoratedSheet(
            hasCounter: false,
            title: "Enter Card details",
            body: CardDetails(
              cardNameController: _cardNameController,
              cardNumberController: _cardNumberController,
              expiryDateController: _expiryDateController,
              securityCodeController: _securityCodeController,
              tapped: () {
              },
            ),
            height: 450,
          ),
        );
      },
    );
  }

  void _showBankPaymentSheet(
      TransactionData transactionData, Map<String, dynamic> metadata) {
    final banking = Provider.of<BankingProvider>(context, listen: false);
    final payments = Provider.of<PaymentsProvider>(context, listen: false);

    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: DecoratedSheet(
            title: "Pick A Bank Account",
            items: banking.userBanks.length,
            body: banking.userBanks.isEmpty
                ? EmptySheetBanks()
                : BankAccounts(
                    tapped: () {},
                  ),
            height: 450,
          ),
        );
      },
    );
  }

  Future<void> _processPayment(PaymentRequest paymentRequest) async {
    final payments = Provider.of<PaymentsProvider>(context, listen: false);
    final credits = Provider.of<CreditsProvider>(context, listen: false);
    final profile = Provider.of<ProfileProvider>(context, listen: false);
    showAdaptiveDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AiAnalysisAlert(
        icon: HugeIcons.strokeRoundedLockPassword,
        action: 'Verifying...',
      ),
    );
    payments.setPendingRequest(paymentRequest);
    await payments.processTransaction(
        context, profile.user?.requiresPinSetup ?? true);

    Navigator.pop(context);

    if (payments.paymentResponse?.error == null) {
      _showSuccessDialog(credits.creditPricing?.smsCount?.toDouble() ?? 0);
    }
  }

  void _showSuccessDialog(double smsCount) {
    showAdaptiveDialog(
      context: context,
      builder: (context) => TopUpAlert(
        title: 'SMS Purchased',
        type: 'SMS CREDITS :',
        amount: formatThousands(amount: smsCount, noDecimal: true),
        tapped: () {
          Navigator.pop(context);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<CreditsProvider>(
      builder: (_, credits, __) {
        return PopScope(
          onPopInvokedWithResult: (bool b, res) {
            credits.resetCreditPricing();
          },
          child: Scaffold(
            backgroundColor: HexColor('#F8FAF9'),
            body: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('gradient2.png')),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Column(
                  children: [
                    // App Bar
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#F0F4F3'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  HugeIcons.strokeRoundedArrowLeft01,
                                  color: HexColor(AppColors.darkerGray2),
                                  size: 20,
                                ),
                              ),
                            ),
                            const Spacer(),
                            Text('SMS Top Up', style: Blacks.mediumSemiRubik),
                            const Spacer(),
                            const SizedBox(width: 36),
                          ],
                        ),
                      ),
                    ),

                    // Scrollable content
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          children: [
                            const SizedBox(height: 20),
                            // Header with icon
                            const SmsTopupHeader(),
                            const SizedBox(height: 24),
                            // Amount input
                            SmsCreditsInput(
                              controller: _amountController,
                              onCalculate: _calculateCost,
                              isLoading: credits.loadingTierPricing,
                            ),
                            // Cost breakdown (shown after calculation)
                            if (credits.creditPricing != null) ...[
                              const SizedBox(height: 16),
                              SmsCostBreakdown(
                                  creditPricing: credits.creditPricing!),
                            ],
                            // Payment methods (shown after calculation)
                            if (credits.creditPricing != null) ...[
                              const SizedBox(height: 16),
                              const SmsPaymentMethods(),
                            ],
                            const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ),

                    // Bottom action button
                    if (credits.creditPricing != null)
                      Container(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(15),
                              blurRadius: 10,
                              offset: const Offset(0, -2),
                            ),
                          ],
                        ),
                        child: SafeArea(
                          top: false,
                          child: SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _handleTopUp,
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    HexColor(AppColors.primaryGreen),
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(HugeIcons.strokeRoundedCoins01,
                                      size: 18),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'PURCHASE CREDITS',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}


