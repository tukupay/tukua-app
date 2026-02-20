import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';
import '../../providers/providers.dart';

class AccountSend extends StatelessWidget {
  const AccountSend({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<PaymentsProvider>(builder: (_, payments, __) {
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
                  // Modern App Bar - using reusable widget
                  const PageAppBar(
                    title: 'Send Money',
                    subtitle: 'Transfer funds securely',
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
                            method: payments.selectedMethod,
                            fallbackIcon: HugeIcons.strokeRoundedMoneySend01,
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => DecoratedSheet(
                                  items: payments.paymentMethods.length - 1,
                                  height: 450,
                                  title: 'Select Send Method',
                                  body: SendMethods(isChanging: true),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 20),
                          // Dynamic content based on method
                          if (payments.selectedMethod?.method == Strings.mpesa)
                            MpesaSend()
                          else if (payments.selectedMethod?.method == Strings.tuku)
                            TukuSend()
                          else if (payments.selectedMethod?.method == Strings.bank)
                            BankSend()
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


