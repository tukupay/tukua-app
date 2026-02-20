import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';

class BankSmsTopup extends StatelessWidget {
  const BankSmsTopup({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer4<PaymentsProvider, BankingProvider, CreditsProvider, ProfileProvider>(
      builder: (_, payments, banking, credits, profile, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            banking.userBanks.isEmpty
                ? EmptyAccountsHint()
                : UserBankSelectorCard(
                    selectedBank: payments.selectedSourceBank,
                    userBanks: banking.userBanks,
                    onSelected: (bank) {
                      payments.selectSourceBank(bank);
                    },
                    label: 'Source Bank Account',
                    sheetTitle: 'Select Bank Account',
                    sheetSubtitle: 'Choose which bank account to pay from',
                  ),
            Spaces.mediumTopSpace,
            // price
            LabeledField(
              label: 'Amount to pay',
              hint: '0',
              initialText: '${credits.creditPricing?.amount?.toInt() ?? 0}',
              enabled: false,
            ),
            Spaces.smallTopSpace,
            Padding(
              padding: Paddings.tinyVertical,
              child: AuthButton(
                tapped: () async {
                  Fluttertoast.cancel();
                  if (payments.selectedSourceBank == null) {
                    Fluttertoast.showToast(msg: 'Select a bank account to proceed');
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
                        paymentMethod: payments.selectedMethod!.method,
                        bankName: payments.selectedSourceBank!.bankName!,
                        accountNumber: payments.selectedSourceBank!.accountNumber!,
                        accountName: payments.selectedSourceBank!.accountName!,
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
