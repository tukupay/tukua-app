import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';

/// Payment method selection card for SMS TopUp
class SmsPaymentMethods extends StatelessWidget {
  const SmsPaymentMethods({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payments, __) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(100),
            border: Border.all(color: HexColor(AppColors.lightGray)),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(10),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: HexColor('#E3F2FD'),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      HugeIcons.strokeRoundedCreditCard,
                      size: 18,
                      color: Colors.blue.shade600,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Payment Method', style: Blacks.tinyBolderPoppins),
                      const SizedBox(height: 2),
                      Text(
                        'Choose how to pay',
                        style: Grays.tinySemiGrotesk.copyWith(fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Payment options
              ListView.separated(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: payments.paymentMethods.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final option = payments.paymentMethods[index];
                  final isSelected = payments.selectedMethod == option;
                  return _PaymentMethodTile(
                    option: option,
                    isSelected: isSelected,
                    onTap: () => payments.selectMethod(option),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Individual payment method tile
class _PaymentMethodTile extends StatelessWidget {
  const _PaymentMethodTile({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final PaymentMethod option;
  final bool isSelected;
  final VoidCallback onTap;

  IconData _getPaymentIcon() {
    switch (option.method) {
      case Strings.tuku:
        return HugeIcons.strokeRoundedWallet01;
      case Strings.mpesa:
        return HugeIcons.strokeRoundedSmartPhone01;
      case Strings.card:
        return HugeIcons.strokeRoundedCreditCard;
      case Strings.bank:
        return HugeIcons.strokeRoundedBank;
      default:
        return HugeIcons.strokeRoundedMoney01;
    }
  }

  Color _getPaymentColor() {
    switch (option.method) {
      case Strings.tuku:
        return HexColor(AppColors.primaryGreen);
      case Strings.mpesa:
        return Colors.green.shade600;
      case Strings.card:
        return Colors.blue.shade600;
      case Strings.bank:
        return Colors.orange.shade600;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getPaymentColor();
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withAlpha(15)
              : HexColor('#F8FAF9'),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : HexColor('#E8ECE9'),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(_getPaymentIcon(), size: 18, color: color),
            ),
            const SizedBox(width: 12),
            Text(
              option.name,
              style: Blacks.regularBoldCodeNext.copyWith(
                fontSize: 14,
                color: isSelected ? color : null,
              ),
            ),
            const Spacer(),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isSelected ? color : Colors.transparent,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? color : HexColor(AppColors.darkerGray2),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : const SizedBox(width: 12, height: 12),
            ),
          ],
        ),
      ),
    );
  }
}

