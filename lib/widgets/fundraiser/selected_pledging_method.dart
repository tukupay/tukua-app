import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class SelectedPledgingMethod extends StatelessWidget {
  const SelectedPledgingMethod({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<FundraiserProvider, PaymentsProvider>(
      builder: (_, fundraiserProvider, payments, __) {
        final selectedMethod = fundraiserProvider.selectedPledgeMethod;

        if (selectedMethod == null) return const SizedBox();

        return SelectedMethodCard(
          method: selectedMethod,
          accentColor: HexColor(AppColors.primaryGreen),
          fallbackIcon: HugeIcons.strokeRoundedAlms,
          onTap: () {
            showModalBottomSheet(
              isScrollControlled: true,
              scrollControlDisabledMaxHeightRatio: 1 / 1,
              context: context,
              backgroundColor: Colors.transparent,
              builder: (pledgingContext) {
                return DecoratedSheet(
                  title: "Select your method",
                  items: payments.paymentMethods.length,
                  body: PledgePaymentOptions(isChanging: true),
                  height: 480,
                );
              },
            );
          },
        );
      },
    );
  }
}
