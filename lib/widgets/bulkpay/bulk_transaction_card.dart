import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../../routes.dart';

/// A sleek, modern transaction card for bulk payments
/// Displays key info: recipients count, total amount, status, date
class BulkTransactionCard extends StatelessWidget {
  final BulkTransaction transaction;
  const BulkTransactionCard({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final DateTime? created = transaction.createdAt;
    final double displayAmount = transaction.amount ?? transaction.recipientsSum;
    final int recipientCount = transaction.recipients?.length ?? 0;
    final String status = transaction.status ?? 'pending';
    final bool isCompleted = status.toLowerCase() == 'completed';

    return GestureDetector(
      onTap: () {
        Provider.of<BulkPayProvider>(context, listen: false)
            .selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.bulkTransactionDetails);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
        padding: const EdgeInsets.all(14),
        width: size.width,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              HexColor('#F8FAF9'),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: HexColor('#E8ECE9'), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Icon + Description + Amount
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon container
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isCompleted
                          ? [HexColor('#E8F5E9'), HexColor('#C8E6C9')]
                          : [HexColor('#FFF3E0'), HexColor('#FFE0B2')],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedUserMultiple02,
                    color: isCompleted
                        ? HexColor(AppColors.primaryGreen)
                        : HexColor(AppColors.primaryOrange),
                    size: 22,
                  ),
                ),
                Spaces.smallSideSpace,
                // Description & meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transaction.description ?? 'Bulk Transfer',
                        style: Blacks.tinyBoldGrotesk.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedUser,
                            size: 12,
                            color: HexColor(AppColors.darkerGray2),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$recipientCount recipient${recipientCount != 1 ? 's' : ''}',
                            style: Grays.tinySemiGrotesk.copyWith(fontSize: 11),
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
                      'KES ${formatThousands(amount: displayAmount)}',
                      style: Blacks.regularBoldGrotesk.copyWith(
                        fontSize: 15,
                        color: HexColor('#1D201E'),
                      ),
                    ),
                    const SizedBox(height: 4),
                    _statusBadge(status),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Bottom row: Date + Arrow
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      HugeIcons.strokeRoundedCalendar03,
                      size: 13,
                      color: HexColor(AppColors.darkerGray2),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      created != null
                          ? '${DateFormat.MMMd().format(created)}, ${DateFormat.jm().format(created)}'
                          : '-',
                      style: Grays.tinySemiGrotesk.copyWith(fontSize: 11),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: HexColor('#F5F7F6'),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedArrowRight01,
                    size: 14,
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bgColor;
    Color textColor;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'completed':
        bgColor = HexColor('#E8F5E9');
        textColor = HexColor('#2E7D32');
        icon = HugeIcons.strokeRoundedCheckmarkCircle01;
        break;
      case 'pending':
        bgColor = HexColor('#FFF8E1');
        textColor = HexColor('#F9A825');
        icon = HugeIcons.strokeRoundedTimeQuarterPass;
        break;
      case 'failed':
        bgColor = HexColor('#FFEBEE');
        textColor = HexColor('#C62828');
        icon = HugeIcons.strokeRoundedCancelCircle;
        break;
      default:
        bgColor = HexColor('#ECEFF1');
        textColor = HexColor('#546E7A');
        icon = HugeIcons.strokeRoundedInformationCircle;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: textColor),
          const SizedBox(width: 4),
          Text(
            status.substring(0, 1).toUpperCase() + status.substring(1),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

