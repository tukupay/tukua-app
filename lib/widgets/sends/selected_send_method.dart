import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class SelectedSendMethod extends StatelessWidget {
  const SelectedSendMethod({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payment, __) {
        if (payment.selectedMethod == null) return const SizedBox();

        return SelectedMethodCard(
          method: payment.selectedMethod,
          accentColor: HexColor(AppColors.primaryGreen),
          fallbackIcon: HugeIcons.strokeRoundedMoneySend01,
          onTap: () {
            showModalBottomSheet(
              scrollControlDisabledMaxHeightRatio: 1 / 1,
              context: context,
              backgroundColor: Colors.transparent,
              builder: (context) {
                return DecoratedSheet(
                  items: payment.paymentMethods.length - 1,
                  height: 450,
                  title: 'Select Send Method',
                  body: SendMethods(isChanging: true),
                );
              },
            );
          },
        );
      },
    );
  }
}
