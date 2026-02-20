import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class TukuSmsTopup extends StatelessWidget {
  const TukuSmsTopup({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer4<WalletProvider, PaymentsProvider, CreditsProvider, ProfileProvider>(
      builder: (_, wallets, payments, credits, profile, ___) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Wallet selector
            wallets.userWallets.isEmpty
                ? EmptyAccountsHint()
                : WalletSelectorCard(
                    selectedWallet: payments.selectedSourceWallet,
                    wallets: wallets.userWallets,
                    onSelected: (wallet) {
                      payments.selectSourceWallet(wallet);
                    },
                    label: 'Select wallet to pay from',
                    sheetTitle: 'Pay From',
                    sheetSubtitle: 'Select wallet to deduct from',
                    isSource: true,
                  ),
            const SizedBox(height: 12),

            // Amount display
            LabeledField(
                label: 'Amount to Pay',
                hint: '0',
                initialText: 'KSH ${formatThousands(amount: credits.creditPricing?.amount ?? 0)}',
                enabled: false,
                prefixIcon: Icon(
                  HugeIcons.strokeRoundedMoney03,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
            const SizedBox(height: 16),

            // Credits info card
            _CreditsInfoCard(credits: credits),
            const SizedBox(height: 32),

            // Proceed button
            AuthButton(
              text: 'Proceed to pay',
              tapped: () => _handleProceed(context, wallets, payments, credits, profile),
            ),
            const SizedBox(height: 16),

            // Info note
            _InfoNote(text: 'The amount will be deducted instantly from your selected wallet.'),
          ],
        );
      },
    );
  }

  void _handleProceed(
    BuildContext context,
    WalletProvider wallets,
    PaymentsProvider payments,
    CreditsProvider credits,
    ProfileProvider profile,
  ) async {
    Fluttertoast.cancel();

    if (payments.selectedSourceWallet == null) {
      Fluttertoast.showToast(msg: 'Please select a wallet to pay from');
      return;
    }

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
        sourceWalletId: payments.selectedSourceWallet?.id,
        paymentMethod: payments.selectedMethod!.method,
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
          amount: formatThousands(amount: credits.creditPricing?.smsCount?.toDouble() ?? 0, noDecimal: true),
          tapped: () {
            Navigator.pop(context);
            Navigator.pop(context);
          },
        ),
      );
    }
  }
}

/// Section header
class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(20),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: HexColor(AppColors.primaryGreen)),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Blacks.smallestBoldPoppins),
            Text(subtitle, style: Grays.tinyPoppinsHint),
          ],
        ),
      ],
    );
  }
}

/// Input card wrapper
class _InputCard extends StatelessWidget {
  final Widget child;

  const _InputCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// Credits info card
class _CreditsInfoCard extends StatelessWidget {
  final CreditsProvider credits;

  const _CreditsInfoCard({required this.credits});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            HexColor(AppColors.primaryGreen).withAlpha(15),
            HexColor(AppColors.primaryGreen).withAlpha(8),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(40),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              HugeIcons.strokeRoundedMail01,
              color: HexColor(AppColors.primaryGreen),
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('You\'ll receive', style: Grays.tinyPoppinsHint),
                const SizedBox(height: 2),
                Text(
                  '${formatThousands(amount: credits.creditPricing?.smsCount?.toDouble() ?? 0, noDecimal: true)} SMS Credits',
                  style: Greens.regularBoldCodeNext,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Info note
class _InfoNote extends StatelessWidget {
  final String text;

  const _InfoNote({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(30),
        ),
      ),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedInformationCircle,
            size: 18,
            color: HexColor(AppColors.primaryGreen),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 11,
                color: HexColor(AppColors.primaryGreen),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
