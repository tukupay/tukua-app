import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class SmsCreditsBreakdown extends StatefulWidget {
  const SmsCreditsBreakdown({super.key});

  @override
  State<SmsCreditsBreakdown> createState() => _SmsCreditsBreakdownState();
}

class _SmsCreditsBreakdownState extends State<SmsCreditsBreakdown> {
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
    switch (payments.selectedMethod!.method) {
      case Strings.tuku:
        _showTukuPaymentSheet(transactionData, metadata);
        break;
      case Strings.mpesa:
        _showMpesaPaymentSheet(transactionData, metadata);
        break;
      case Strings.card:
        _showCardPaymentSheet(transactionData, metadata);
        break;
      case Strings.bank:
        _showBankPaymentSheet(transactionData, metadata);
        break;
    }
  }

  void _showTukuPaymentSheet(
      TransactionData transactionData, Map<String, dynamic> metadata) {
    final wallets = Provider.of<WalletProvider>(context, listen: false);
    final payments = Provider.of<PaymentsProvider>(context, listen: false);
    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1 / 1,
      context: context,
      builder: (context) {
        return DecoratedSheet(
          title: "Select which wallet to use",
          items: wallets.userWallets.length,
          body: wallets.userWallets.isEmpty
              ? EmptySheetWallets()
              : TukuWallets(
                  tapped: () async {
                    if (payments.selectedSourceWallet == null) {
                      Fluttertoast.showToast(msg: "Please select a wallet");
                    } else {
                      _processPayment(
                        PaymentRequest(
                          transactionData: transactionData,
                          paymentSource: PaymentSource(
                            sourceWalletId: payments.selectedSourceWallet?.id,
                            paymentMethod: payments.selectedMethod!.method,
                          ),
                          metadata: metadata,
                        ),
                      );
                    }
                  },
                ),
          height: 450,
        );
      },
    );
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
                _processPayment(
                  PaymentRequest(
                    transactionData: transactionData,
                    paymentSource: PaymentSource(
                        cardName: _cardNameController.text,
                        cardNumber:
                            _cardNumberController.text.replaceAll(" ", ""),
                        expiryMonth: int.parse(
                            _expiryDateController.text.split('/')[0]),
                        expiryYear:
                            int.parse(_expiryDateController.text.split('/')[1]),
                        cvv: _securityCodeController.text,
                        paymentMethod:
                            Provider.of<PaymentsProvider>(context, listen: false)
                                .selectedMethod!
                                .method),
                    metadata: metadata,
                  ),
                );
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
                    tapped: () {
                      _processPayment(
                        PaymentRequest(
                          transactionData: transactionData,
                          paymentSource: PaymentSource(
                              paymentMethod: payments.selectedMethod!.method,
                              bankName: payments.selectedSourceBank!.bankName!,
                              accountNumber:
                                  payments.selectedSourceBank!.accountNumber!,
                              accountName:
                                  payments.selectedSourceBank!.accountName!),
                          metadata: metadata,
                        ),
                      );
                    },
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

    Navigator.pop(context); // pop alert

    if (payments.paymentResponse?.error == null) {
      _showSuccessDialog(credits.creditPricing?.smsCount?.toDouble() ?? 0);
    }
  }

  void _showSuccessDialog(double smsCount) {
    showAdaptiveDialog(
      context: context,
      builder: (context) => TopUpAlert(
        title: 'SMS Credits Purchased',
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
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      resizeToAvoidBottomInset: true,
      body: Consumer<CreditsProvider>(
        builder: (_, credits, __) {
          return PopScope(
            onPopInvokedWithResult: (bool b, res) {
              credits.resetCreditPricing();
            },
            child: Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: CustomScrollView(
                slivers: [
                  // Modern AppBar
                  SliverAppBar(
                    expandedHeight: 160,
                    floating: false,
                    pinned: true,
                    backgroundColor: HexColor(AppColors.primaryGreen),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    iconTheme: const IconThemeData(color: Colors.white),
                    flexibleSpace: FlexibleSpaceBar(
                      titlePadding: const EdgeInsets.only(left: 60, bottom: 16),
                      title: Text(
                        'Top Up SMS Credits',
                        style: Whites.mediumBoldRoboto,
                      ),
                      background: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              HexColor(AppColors.primaryGreen),
                              HexColor(AppColors.primaryGreen)
                                  .withValues(alpha: 0.8),
                            ],
                          ),
                        ),
                        child: Stack(
                          children: [
                            Positioned(
                              right: -50,
                              top: -50,
                              child: Container(
                                width: 200,
                                height: 200,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withValues(alpha: 0.1),
                                ),
                              ),
                            ),
                            Positioned(
                              left: -30,
                              bottom: -30,
                              child: Container(
                                width: 150,
                                height: 150,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withValues(alpha: 0.1),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Content
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: Paddings.smallHorizontal,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Spaces.smallTopSpace,

                          // SMS Amount Input Card
                          _buildSmsAmountCard(credits),

                          // Cost Breakdown Card
                          if (credits.creditPricing != null) ...[
                            Spaces.mediumTopSpace,
                            _buildCostBreakdownCard(credits.creditPricing!),
                          ],

                          // Payment Method Selection Card
                          if (credits.creditPricing != null) ...[
                            Spaces.mediumTopSpace,
                            _buildPaymentMethodCard(),
                          ],

                          Spaces.largeTopSpace,
                          const SizedBox(height: 80), // Space for bottom button
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: Consumer<CreditsProvider>(
        builder: (_, credits, __) {
          if (credits.creditPricing == null) return const SizedBox();

          return Container(
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
              child: ElevatedButton(
                onPressed: _handleTopUp,
                style: ElevatedButton.styleFrom(
                  backgroundColor: HexColor(AppColors.primaryGreen),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(HugeIcons.strokeRoundedAdd01, size: 20),
                    const SizedBox(width: 10),
                    Text(
                      'TOP UP NOW',
                      style: Whites.regularSemiRoboto.copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Build SMS amount input card
  Widget _buildSmsAmountCard(CreditsProvider credits) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color:
                        HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedMail01,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Text('SMS Credits', style: Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How many SMS credits do you want?',
                  style: Blacks.regularSemiRoboto,
                ),
                Spaces.smallTopSpace,
                Container(
                  decoration: BoxDecoration(
                    color: HexColor('#F8FAF9'),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    style: Blacks.regularBoldCodeNext,
                    decoration: InputDecoration(
                      hintText: '1000',
                      hintStyle: Grays.tinyPoppinsHint,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                      prefixIcon: Icon(
                        HugeIcons.strokeRoundedMail01,
                        color: HexColor(AppColors.primaryGreen),
                        size: 20,
                      ),
                    ),
                  ),
                ),
                Spaces.mediumTopSpace,
                SizedBox(
                  width: double.infinity,
                  child: credits.loadingTierPricing
                      ? const Center(child: WaveDots())
                      : ElevatedButton(
                          onPressed: _calculateCost,
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                            foregroundColor: HexColor(AppColors.primaryGreen),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.3),
                              ),
                            ),
                            elevation: 0,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(HugeIcons.strokeRoundedCalculator,
                                  size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'CALCULATE COST',
                                style: TextStyle(
                                  color: HexColor(AppColors.primaryGreen),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Build cost breakdown card
  Widget _buildCostBreakdownCard(CreditTierPricing creditPricing) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color:
                        HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedDollarCircle,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Text('Cost Breakdown', style: Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildCostRow(
                  'SMS Count',
                  '${formatThousands(amount: creditPricing.smsCount?.toDouble() ?? 0, noDecimal: true)} SMS',
                  HugeIcons.strokeRoundedMail01,
                ),
                const SizedBox(height: 12),
                _buildCostRow(
                  'Price Per SMS',
                  'KES ${creditPricing.sellingPricePerSms}',
                  HugeIcons.strokeRoundedTag01,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedCheckmarkCircle02,
                        color: HexColor(AppColors.primaryGreen),
                        size: 20,
                      ),
                      Spaces.smallSideSpace,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Cost',
                              style: Grays.smallRoboto,
                            ),
                            Text(
                              'KES ${formatThousands(amount: creditPricing.amount ?? 0, noDecimal: true)}',
                              style: Greens.regularBoldCodeNext.copyWith(
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Build payment method card
  Widget _buildPaymentMethodCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color:
                        HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedWallet03,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child:
                      Text('Payment Method', style: Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Consumer<PaymentsProvider>(
              builder: (_, payments, __) {
                return ListView.separated(
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: payments.paymentMethods.length,
                  shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final option = payments.paymentMethods[index];
                    return MethodCard(
                      method: option,
                      isSelected: payments.selectedMethod == option,
                      onTap: () => payments.selectMethod(option),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // Build cost row helper
  Widget _buildCostRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: Colors.grey.shade600,
        ),
        Spaces.smallSideSpace,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Grays.smallRoboto),
              const SizedBox(height: 2),
              Text(value, style: Blacks.regularSemiRoboto),
            ],
          ),
        ),
      ],
    );
  }
}

