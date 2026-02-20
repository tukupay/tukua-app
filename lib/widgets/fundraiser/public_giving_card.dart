import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';

/// Modern fintech-styled giving/contribution card
/// Displays contribution details with sleek gradient design
class PublicGivingCard extends StatelessWidget {
  final int index;
  final ContributionResponse contribution;
  const PublicGivingCard({
    super.key,
    required this.index,
    required this.contribution,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (_, payments, __) {
        final paymentMethod = _getPaymentMethodName(payments);
        final isAnonymous = contribution.isAnonymous ?? false;

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: index % 2 == 0
                  ? [Colors.white, HexColor('#FFF9F5')]
                  : [Colors.white, HexColor('#F8FAF9')],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: HexColor('#E8ECE9'), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(8),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Index badge
              _buildIndexBadge(),
              const SizedBox(width: 12),

              // Contribution icon
              _buildIcon(),
              const SizedBox(width: 12),

              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAnonymous ? 'Anonymous Giving' : (contribution.message ?? 'Contribution'),
                      style: Blacks.tinyBoldGrotesk.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    _buildMethodChip(paymentMethod),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedCalendar03,
                          size: 11,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          contribution.contributedAt != null
                              ? DateFormat.MMMd().format(contribution.contributedAt!)
                              : '-',
                          style: Grays.tinySemiGrotesk.copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Amount
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'KES ${formatThousands(amount: contribution.amount ?? 0)}',
                    style: Greens.regularBoldCodeNext.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  _buildSuccessBadge(),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildIndexBadge() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(25),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          '${index + 1}',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: HexColor(AppColors.primaryGreen),
          ),
        ),
      ),
    );
  }

  Widget _buildIcon() {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        HugeIcons.strokeRoundedGift,
        color: HexColor(AppColors.primaryGreen),
        size: 18,
      ),
    );
  }

  Widget _buildMethodChip(String method) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: HexColor('#F0F4F3'),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getMethodIcon(method),
            size: 9,
            color: HexColor(AppColors.darkerGray2),
          ),
          const SizedBox(width: 3),
          Flexible(
            child: Text(
              method,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w500,
                color: HexColor(AppColors.darkerGray2),
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getMethodIcon(String method) {
    switch (method.toLowerCase()) {
      case 'mpesa':
      case 'm-pesa':
        return HugeIcons.strokeRoundedSmartPhone01;
      case 'wallet':
      case 'tuku':
        return HugeIcons.strokeRoundedWallet01;
      case 'bank':
        return HugeIcons.strokeRoundedBank;
      case 'card':
        return HugeIcons.strokeRoundedCreditCard;
      default:
        return HugeIcons.strokeRoundedPayment01;
    }
  }

  Widget _buildSuccessBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: HexColor('#E8F5E9'),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            HugeIcons.strokeRoundedCheckmarkCircle01,
            size: 9,
            color: HexColor('#2E7D32'),
          ),
          const SizedBox(width: 3),
          Text(
            'Received',
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w600,
              color: HexColor('#2E7D32'),
            ),
          ),
        ],
      ),
    );
  }

  String _getPaymentMethodName(PaymentsProvider payments) {
    if (contribution.transferType == null) return 'Direct';
    try {
      final method = payments.paymentMethods.firstWhere(
        (el) => el.method == contribution.transferType,
      );
      return method.name;
    } catch (e) {
      return contribution.transferType!;
    }
  }
}
