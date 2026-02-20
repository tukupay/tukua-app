import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';

class AccountTopUp extends StatelessWidget {
  const AccountTopUp({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<PaymentsProvider>(builder: (_, payment, __) {
      return PopScope(
        canPop: true,
        onPopInvokedWithResult: (bool b, res) {
          Provider.of<PaymentsProvider>(context, listen: false).reset();
          Provider.of<CheckoutProvider>(context, listen: false).reset();
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
                  // Modern App Bar - using reusable widget
                  const PageAppBar(
                    title: 'Top Up Wallet',
                    subtitle: 'Add funds to your wallet',
                  ),
                  // Body
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Selected method card
                          SelectedMethodCard(
                            method: payment.selectedMethod,
                            fallbackIcon: HugeIcons.strokeRoundedCreditCard,
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => DecoratedSheet(
                                  items: payment.paymentMethods.length + 1,
                                  height: 600,
                                  title: 'Select Top Up Method',
                                  body: TopUpMethods(isChanging: true),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 20),
                          // Dynamic content based on method
                          if (payment.selectedMethod?.method == Strings.mpesa)
                            MpesaTopUp()
                          else if (payment.selectedMethod?.method == Strings.tuku)
                            TukuTopUp()
                          else if (payment.selectedMethod?.method == Strings.card)
                            CardTopUp()
                          else if (payment.selectedMethod?.method == Strings.bank)
                            BankTopUp()
                          else if (payment.selectedMethod?.method == Strings.link)
                            LinkTopUp(),
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
    });
  }
}


