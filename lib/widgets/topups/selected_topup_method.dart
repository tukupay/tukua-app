import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import 'package:tuku/constants/constants.dart';

class SelectedTopUpMethod extends StatelessWidget {
  const SelectedTopUpMethod({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payment, __) {
        if (payment.selectedMethod == null) return const SizedBox();

        return SelectedMethodCard(
          method: payment.selectedMethod,
          accentColor: HexColor(AppColors.primaryGreen),
          fallbackIcon: HugeIcons.strokeRoundedCreditCard,
          onTap: () {
            showModalBottomSheet(
              scrollControlDisabledMaxHeightRatio: 1 / 1,
              context: context,
              backgroundColor: Colors.transparent,
              builder: (context) {
                return DecoratedSheet(
                  items: payment.paymentMethods.length + 1,
                  height: 550,
                  title: 'Select Top Up Method',
                  body: TopUpMethods(isChanging: true),
                );
              },
            );
          },
        );
      },
    );
  }
}
