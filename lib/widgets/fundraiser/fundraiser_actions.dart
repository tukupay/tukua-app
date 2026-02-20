import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../routes.dart';

class FundraiserActions extends StatelessWidget {
  const FundraiserActions({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<PaymentsProvider>(
      builder: (_, payments, __) {
        return Container(
          width: size.width,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: HexColor(AppColors.lightestGray)),
            boxShadow: [
              BoxShadow(
                offset: const Offset(0, 4),
                blurRadius: 16,
                spreadRadius: -2,
                color: Colors.black.withAlpha(12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen).withAlpha(20),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      HugeIcons.strokeRoundedDashboardSpeed02,
                      size: 18,
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Quick Actions',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: HugeIcons.strokeRoundedAdd01,
                      label: 'Deposit',
                      color: HexColor(AppColors.primaryGreen),
                      onTap: () {
                        showModalBottomSheet(
                          scrollControlDisabledMaxHeightRatio: 1 / 1,
                          context: context,
                          builder: (context) {
                            return DecoratedSheet(
                              items: payments.paymentMethods.length+1,
                              height: 610,
                              title: 'Select Top Up Method',
                              body: TopUpMethods(),
                            );
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: HugeIcons.strokeRoundedMoneySendCircle,
                      label: 'Withdraw',
                      color: HexColor(AppColors.primaryOrange),
                      onTap: () {
                        showModalBottomSheet(
                          scrollControlDisabledMaxHeightRatio: 1 / 1,
                          context: context,
                          builder: (context) {
                            return DecoratedSheet(
                              items: payments.paymentMethods.length - 1,
                              height: 450,
                              title: 'Select Method',
                              body: SendMethods(),
                            );
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: HugeIcons.strokeRoundedShoppingBasketFavorite01,
                      label: 'Pledges',
                      color: HexColor(AppColors.fadedGreen),
                      onTap: () {
                        Navigator.pushNamed(context, Routes.fundraiserPledgers);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withAlpha(40)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withAlpha(30),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
