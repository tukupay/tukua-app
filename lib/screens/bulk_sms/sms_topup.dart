import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';

class SmsTopup extends StatelessWidget {
  const SmsTopup({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<PaymentsProvider>(
      builder: (_, payment, __) {
        return PopScope(
          canPop: true,
          onPopInvokedWithResult: (bool b, res) {
            Provider.of<PaymentsProvider>(context, listen: false).reset();
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
                    // Modern App Bar - using reusable widget with credits badge
                    PageAppBar(
                      title: 'SMS Top Up',
                      subtitle: 'Purchase SMS credits',
                      trailing: _CreditsBadge(),
                    ),
                    // Body
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Selected method card - using shared widget
                            SelectedMethodCard(
                              method: payment.selectedMethod,
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (context) => DecoratedSheet(
                                    items: payment.paymentMethods.length,
                                    height: 530,
                                    title: 'Select Payment Method',
                                    body: TopUpMethods(isChanging: true, showLinkMethod: false),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 20),
                            // Dynamic content based on method
                            if (payment.selectedMethod?.method == Strings.mpesa)
                              MpesaSmsTopup()
                            else if (payment.selectedMethod?.method == Strings.tuku)
                              TukuSmsTopup()
                            else if (payment.selectedMethod?.method == Strings.card)
                              CardSmsTopup()
                            else if (payment.selectedMethod?.method == Strings.bank)
                              BankSmsTopup(),
                          ],
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

/// Credits badge widget for SMS top up app bar
class _CreditsBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<CreditsProvider>(
      builder: (_, credits, __) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen).withAlpha(20),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              HugeIcons.strokeRoundedMail01,
              size: 14,
              color: HexColor(AppColors.primaryGreen),
            ),
            const SizedBox(width: 6),
            Text(
              '${credits.creditBalance?.smsBalance ?? 0}',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

