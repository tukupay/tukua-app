import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

class TransactionValidation extends StatelessWidget {
  final String text;
  final void Function() tapped;
  final ValidationResponse transaction;

  const TransactionValidation({
    super.key,
    required this.text,
    required this.tapped,
    required this.transaction,
  });

  @override
  Widget build(BuildContext context) {
    final bool isStkPush = transaction.sourceValidation?.sourceType == 'stk_push';

    return Consumer<PaymentsProvider>(builder: (_, payments, __) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              HexColor('#F8FAF9'),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      HexColor(AppColors.primaryGreen),
                      HexColor(AppColors.fadedGreen),
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(50),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      isStkPush
                          ? HugeIcons.strokeRoundedSmartPhone01
                          : HugeIcons.strokeRoundedCheckmarkSquare01,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isStkPush ? 'Confirm STK Push' : 'Confirm Transaction',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Review details before proceeding',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.white.withAlpha(200),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Details section
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  if (isStkPush)
                    _buildStkPushDetails(transaction)
                  else
                    _buildStandardDetails(transaction, payments),

                  const SizedBox(height: 24),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: _ActionButton(
                          text: 'Cancel',
                          isOutlined: true,
                          onTap: () => Navigator.pop(context),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ActionButton(
                          text: text,
                          onTap: tapped,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        ),
      );
    });
  }

  String _getSourceText(SourceValidation? source) {
    if (source == null) return '--';
    switch (source.sourceType) {
      case 'wallet':
        return "Wallet (${source.wallet?.name ?? '...'})";
      case 'mpesa':
        return "M-Pesa (${source.phoneNumber ?? '...'})";
      case 'card':
        return "Card (${source.cardDetails?.cardNumberMasked ?? '...'})";
      case 'stk_push':
        return "STK Push from (${source.customerPhone ?? '...'})";
      default:
        return source.sourceType ?? '--';
    }
  }

  Widget _buildStkPushDetails(ValidationResponse transaction) {
    return Column(
      children: [
        _DetailRow(
          icon: HugeIcons.strokeRoundedBuilding06,
          label: 'To Business',
          value: transaction.destinationValidation?.businessName ?? '--',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedNote,
          label: 'Description',
          value: transaction.destinationValidation?.description ?? '--',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedWallet03,
          label: 'Wallet',
          value: transaction.destinationValidation?.wallet?.name ?? '-',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedMoney03,
          label: 'Amount',
          value: '${transaction.currency} ${formatThousands(amount: transaction.amount ?? 0)}',
          isHighlighted: true,
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedCall,
          label: 'From Phone',
          value: transaction.sourceValidation?.customerPhone ?? '--',
        ),
      ],
    );
  }

  Widget _buildStandardDetails(ValidationResponse transaction, PaymentsProvider payments) {
    return Column(
      children: [
        _DetailRow(
          icon: HugeIcons.strokeRoundedExchange01,
          label: 'Type',
          value: payments.selectedType?.name ?? '--',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedWalletRemove01,
          label: 'Source',
          value: _getSourceText(transaction.sourceValidation),
        ),
        if (transaction.sourceValidation?.sourceType == 'wallet')
          _DetailRow(
            icon: HugeIcons.strokeRoundedCoins01,
            label: 'Balance',
            value: transaction.sourceValidation?.wallet != null
                ? '${transaction.currency}. ${formatThousands(amount: transaction.sourceValidation!.wallet!.balance ?? 0)}'
                : '--',
          ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedMoneySend01,
          label: 'Method',
          value: payments.paymentMethods
                  .where((el) => el.method == transaction.destinationValidation?.transferMethod)
                  .isNotEmpty
              ? payments.paymentMethods
                  .firstWhere((el) => el.method == transaction.destinationValidation?.transferMethod)
                  .name
              : '(Not a transfer)',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedUser,
          label: 'Recipient',
          value: transaction.destinationValidation?.destinationName ?? '--',
        ),
        _DetailRow(
          icon: HugeIcons.strokeRoundedMoney03,
          label: 'Amount',
          value: '${transaction.currency} ${formatThousands(amount: transaction.amount ?? 0)}',
          isHighlighted: true,
        ),
      ],
    );
  }
}

/// Detail row widget
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isHighlighted;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: HexColor('#E8ECE9'),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isHighlighted
                  ? HexColor(AppColors.primaryGreen).withAlpha(20)
                  : HexColor('#F5F7F6'),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 16,
              color: isHighlighted
                  ? HexColor(AppColors.primaryGreen)
                  : Colors.grey.shade600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Grays.tinyPoppinsHint),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: isHighlighted
                      ? Greens.regularBoldCodeNext
                      : Blacks.smallestBoldPoppins,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Action button widget
class _ActionButton extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  final bool isOutlined;

  const _ActionButton({
    required this.text,
    required this.onTap,
    this.isOutlined = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          gradient: isOutlined
              ? null
              : LinearGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen),
                    HexColor(AppColors.fadedGreen),
                  ],
                ),
          color: isOutlined ? Colors.transparent : null,
          borderRadius: BorderRadius.circular(12),
          border: isOutlined
              ? Border.all(color: HexColor(AppColors.red), width: 1.5)
              : null,
        ),
        child: Center(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isOutlined ? HexColor(AppColors.red) : Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}
