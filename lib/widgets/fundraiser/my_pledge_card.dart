import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../widget.dart';

/// Modern fintech-styled pledge card for "My Pledges" tab
/// Displays pledge commitment with progress, status, and pay action
class MyPledgeCard extends StatelessWidget {
  final int index;
  final PledgeResponse pledge;
  const MyPledgeCard({
    super.key,
    required this.index,
    required this.pledge,
  });

  @override
  Widget build(BuildContext context) {
    final status = pledge.status ?? 'pending';
    final total = pledge.amount ?? 1;
    final paid = pledge.amountPaid ?? 0;
    final progress = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;
    final percentPaid = (progress * 100).toStringAsFixed(0);

    return Consumer<PaymentsProvider>(
      builder: (_, payments, __) {
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _getGradientColors(status),
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _getBorderColor(status),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(8),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status icon
                  _buildStatusIcon(status),
                  const SizedBox(width: 14),

                  // Pledge details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                pledge.message ?? 'Pledge Commitment',
                                style: Blacks.tinyBoldGrotesk.copyWith(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            _buildStatusChip(status),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Amount row
                        Row(
                          children: [
                            Text(
                              'KES ${formatThousands(amount: pledge.amount ?? 0, noDecimal: true)}',
                              style: Greens.regularBoldCodeNext.copyWith(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '$percentPaid% paid',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: HexColor(AppColors.primaryGreen),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Progress bar
                        Container(
                          height: 5,
                          decoration: BoxDecoration(
                            color: HexColor('#E8ECE9'),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: FractionallySizedBox(
                            widthFactor: 1,
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: FractionallySizedBox(
                                widthFactor: progress,
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        HexColor(AppColors.primaryGreen),
                                        HexColor(AppColors.fadedGreen),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Meta info row
                        Row(
                          children: [
                            _buildMetaItem(
                              icon: HugeIcons.strokeRoundedCoins01,
                              label: 'Remaining',
                              value: formatThousands(
                                amount: pledge.amountRemaining ?? 0,
                                noDecimal: true,
                              ),
                            ),
                            const SizedBox(width: 16),
                            if (pledge.fulfillmentDeadline != null)
                              _buildMetaItem(
                                icon: HugeIcons.strokeRoundedCalendar03,
                                label: 'Deadline',
                                value: DateFormat.MMMd()
                                    .format(pledge.fulfillmentDeadline!),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Pay button - only for active pledges
              if (status.toLowerCase() != 'fulfilled' &&
                  status.toLowerCase() != 'completed' &&
                  status.toLowerCase() != 'cancelled')
                SizedBox(
                  width: double.infinity,
                  child: GestureDetector(
                    onTap: () {
                      Provider.of<FundraiserProvider>(context, listen: false)
                          .selectPledge(pledge);
                      showModalBottomSheet(
                        isScrollControlled: true,
                        scrollControlDisabledMaxHeightRatio: 1 / 1,
                        context: context,
                        backgroundColor: Colors.transparent,
                        builder: (givingContext) {
                          return DecoratedSheet(
                            title: "Select your method",
                            items: payments.paymentMethods.length,
                            body: PledgePaymentOptions(),
                            height: 480,
                          );
                        },
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            HexColor(AppColors.primaryGreen),
                            HexColor(AppColors.fadedGreen),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedMoneySend01,
                            size: 16,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Fulfill Pledge',
                            style: Whites.smallBoldRoboto,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusIcon(String status) {
    Color bgStart;
    Color bgEnd;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        bgStart = HexColor('#E8F5E9');
        bgEnd = HexColor('#C8E6C9');
        icon = HugeIcons.strokeRoundedCheckmarkCircle01;
        break;
      case 'partial':
        bgStart = HexColor('#FFF3E0');
        bgEnd = HexColor('#FFE0B2');
        icon = HugeIcons.strokeRoundedTimeHalfPass;
        break;
      case 'cancelled':
        bgStart = HexColor('#FFEBEE');
        bgEnd = HexColor('#FFCDD2');
        icon = HugeIcons.strokeRoundedCancelCircle;
        break;
      default:
        bgStart = HexColor('#E3F2FD');
        bgEnd = HexColor('#BBDEFB');
        icon = HugeIcons.strokeRoundedHandPrayer;
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [bgStart, bgEnd],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        icon,
        color: HexColor(AppColors.primaryGreen),
        size: 20,
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        bgColor = HexColor('#E8F5E9');
        textColor = HexColor('#2E7D32');
        break;
      case 'partial':
        bgColor = HexColor('#FFF8E1');
        textColor = HexColor('#F9A825');
        break;
      case 'cancelled':
        bgColor = HexColor('#FFEBEE');
        textColor = HexColor('#C62828');
        break;
      default:
        bgColor = HexColor('#E3F2FD');
        textColor = HexColor('#1976D2');
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.substring(0, 1).toUpperCase() + status.substring(1),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildMetaItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 12,
          color: HexColor(AppColors.darkerGray2),
        ),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
            Text(
              value,
              style: Blacks.tinyBoldGrotesk.copyWith(fontSize: 11),
            ),
          ],
        ),
      ],
    );
  }

  List<Color> _getGradientColors(String status) {
    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        return [Colors.white, HexColor('#F1F8E9')];
      case 'partial':
        return [Colors.white, HexColor('#FFF8E1')];
      case 'cancelled':
        return [Colors.white, HexColor('#FFF5F5')];
      default:
        return [Colors.white, HexColor('#F8FAF9')];
    }
  }

  Color _getBorderColor(String status) {
    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        return HexColor('#C8E6C9');
      case 'partial':
        return HexColor('#FFE0B2');
      case 'cancelled':
        return HexColor('#FFCDD2');
      default:
        return HexColor('#E8ECE9');
    }
  }
}
