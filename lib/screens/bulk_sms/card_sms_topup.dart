import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';
import '../../services/services.dart';

class CardSmsTopup extends StatefulWidget {
  const CardSmsTopup({super.key});

  @override
  State<CardSmsTopup> createState() => _CardSmsTopupState();
}

class _CardSmsTopupState extends State<CardSmsTopup> {
  final cardNameController=TextEditingController();
  final cardNumberController=TextEditingController();
  final expiryDateController=TextEditingController();
  final securityController=TextEditingController();


  @override
  Widget build(BuildContext context) {
    return Consumer4<WalletProvider, CreditsProvider, PaymentsProvider, ProfileProvider>(
      builder: (_, wallets, credits, payments, profile, ___) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // card name
            LabeledField(
              controller: cardNameController,
              label: 'Enter Card Name',
              hint: 'eg PETER GRIFFIN',
              canGoNext: true,
              enabled: true,
            ),
            Spaces.smallTopSpace,
            // card number
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
            ),
            Spaces.smallTopSpace,
            Row(
              children: [
                // expiry date
                Flexible(
                  child: LabeledField(
                    label: 'Expiration Date',
                    hint: 'MM/YYYY',
                    controller: expiryDateController,
                    canGoNext: true,
                    isNumber: true,
                    enabled: true,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      ExpiryDateFormatter(),
                    ],
                  ),
                ),
                Spaces.smallSideSpace,
                // security code
                Flexible(
                  child: LabeledField(
                    label: 'Security Code',
                    hint: 'CVV/CVC',
                    canGoNext: true,
                    controller: securityController,
                    isNumber: true,
                    enabled: true,
                  ),
                ),
              ],
            ),
            Spaces.smallTopSpace,
            LabeledField(
              label: 'Amount',
              hint: 'KSH',
              initialText: credits.creditPricing?.amount.toString(),
              isNumber: true,
              enabled: false,
            ),
            Spaces.smallTopSpace,
            Padding(
              padding: Paddings.tinyVertical,
              child: AuthButton(
                tapped: () async {
                  Fluttertoast.cancel();
                  if (cardNameController.text.isEmpty) {
                    Fluttertoast.showToast(msg: "Enter the name on the card");
                  } else if (cardNumberController.text.isEmpty) {
                    Fluttertoast.showToast(msg: "Enter the card number");
                  } else if (cardNumberController.text.replaceAll(" ", "").length != 16) {
                    Fluttertoast.showToast(msg: "Enter a 16-digit card number");
                  } else if (expiryDateController.text.isEmpty) {
                    Fluttertoast.showToast(msg: "Enter the expiry date");
                  } else if (securityController.text.isEmpty) {
                    Fluttertoast.showToast(msg: "Enter the security code");
                  } else if (securityController.text.length != 3) {
                    Fluttertoast.showToast(msg: "Enter a 3-digit security code");
                  } else {
                    showAdaptiveDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) => const AiAnalysisAlert(
                        icon: HugeIcons.strokeRoundedLockPassword,
                        action: 'Verifying...',
                      ),
                    );
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
                    final request = PaymentRequest(
                      transactionData: transactionData,
                      paymentSource: PaymentSource(
                        cardName: cardNameController.text,
                        cardNumber: cardNumberController.text.replaceAll(" ", ""),
                        expiryMonth: int.parse(expiryDateController.text.split('/')[0]),
                        expiryYear: int.parse(expiryDateController.text.split('/')[1]),
                        cvv: securityController.text,
                        paymentMethod: Provider.of<PaymentsProvider>(context, listen: false)
                            .selectedMethod!
                            .method,
                      ),
                      metadata: metadata,
                    );
                    payments.setPendingRequest(request);
                    await payments.processTransaction(context, profile.user?.requiresPinSetup ?? true);
                    Navigator.pop(context);
                    if (payments.paymentResponse?.error == null) {
                      showAdaptiveDialog(
                        context: context,
                        builder: (context) => TopUpAlert(
                          title: 'SMS Purchased',
                          type: 'SMS CREDITS :',
                          amount: formatThousands(
                            amount: credits.creditPricing?.smsCount?.toDouble() ?? 0,
                            noDecimal: true,
                          ),
                          tapped: () {
                            Navigator.pop(context);
                            Navigator.pop(context);
                          },
                        ),
                      );
                    }
                  }
                },
                text: "Proceed to pay",
              ),
            ),
          ],
        );
      },
    );
  }
}
