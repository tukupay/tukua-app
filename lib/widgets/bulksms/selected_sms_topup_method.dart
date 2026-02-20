import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import '../../constants/constants.dart';
import '../widget.dart';
import 'package:tuku/providers/providers.dart';

class SelectedSmsTopupMethod extends StatelessWidget {
  const SelectedSmsTopupMethod({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payment, __) {
        if (payment.selectedMethod == null) return const SizedBox();

        return GestureDetector(
          onTap: () {
            showModalBottomSheet(
              scrollControlDisabledMaxHeightRatio: 1 / 1,
              context: context,
              backgroundColor: Colors.transparent,
              builder: (context) {
                return DecoratedSheet(
                  items: payment.paymentMethods.length,
                  height: 500,
                  title: 'Select SMS Top Up Method',
                  body: TopUpMethods(isChanging: true, showLinkMethod: false),
                );
              },
            );
          },
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  HexColor(AppColors.primaryGreen).withAlpha(15),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: HexColor(AppColors.primaryGreen).withAlpha(60),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: HexColor(AppColors.primaryGreen).withAlpha(20),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Method icon
                Container(
                  height: 50,
                  width: 50,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: HexColor(AppColors.primaryGreen).withAlpha(40),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(10),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Image.network(
                    payment.selectedMethod!.iconUrl!,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Icon(
                      HugeIcons.strokeRoundedCreditCard,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                // Method info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        payment.selectedMethod!.name,
                        style: Blacks.regularBoldCodeNext,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        payment.selectedMethod!.description ?? 'Top up method',
                        style: Grays.tinyPoppinsHint,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Change button
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Change',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: HexColor(AppColors.primaryGreen),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        HugeIcons.strokeRoundedExchange01,
                        size: 14,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
