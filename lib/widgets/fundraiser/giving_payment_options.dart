import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../widget.dart';
import '../../constants/constants.dart';

class GivingPaymentOptions extends StatefulWidget {
  final bool? isChanging;
  const GivingPaymentOptions({super.key,
  this.isChanging = false});

  @override
  State<GivingPaymentOptions> createState() => _GivingPaymentOptionsState();
}

class _GivingPaymentOptionsState extends State<GivingPaymentOptions> {
  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payments, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ListView.separated(
              itemCount: payments.paymentMethods.length,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final option = payments.paymentMethods[index];
                return Consumer<FundraiserProvider>(
                  builder: (_, fundraiser, __) {
                    return MethodCard(
                      method: option,
                      isSelected: fundraiser.selectedContributionMethod == option,
                      onTap: () {
                        Provider.of<FundraiserProvider>(context, listen: false)
                            .setContributionMethod(option);
                      },
                    );
                  },
                );
              },
            ),
            Spaces.tinyTopSpace,
            Consumer3<FundraiserProvider, WalletProvider, ProfileProvider>(
              builder: (_, fundraiserProvider, walletProvider, profile, __) {
                return SheetButton(
                  enabled: fundraiserProvider.selectedContributionMethod != null,
                  text: 'Next',
                  tapped: () {
                    if(widget.isChanging==true){
                      Navigator.pop(context);
                    }else{
                      Navigator.pushNamed(context, Routes.myContribution);
                    }
                  },
                );
              },
            ),
          ],
        );
      },
    );
  }
}

String tukuGivingMethod = 'tukupay_wallet';
String mpesaGivingMethod = 'mpesa';
String cardGivingMethod = 'card';
String bankGivingMethod = 'bank';
