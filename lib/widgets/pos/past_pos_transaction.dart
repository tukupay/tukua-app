import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../models/models.dart';

/// Widget for displaying a single POS transaction in a list
class PastPosTransaction extends StatelessWidget {
  final int index;
  final Transaction transaction;

  const PastPosTransaction({
    super.key,
    required this.index,
    required this.transaction,
  });

  @override
  Widget build(BuildContext context) {
    final isSuccessful = transaction.status?.toLowerCase() == 'completed' ||
        transaction.status?.toLowerCase() == 'success';
    final isPending = transaction.status?.toLowerCase() == 'pending';

    final statusColor = isSuccessful
        ? HexColor(AppColors.primaryGreen)
        : isPending
            ? HexColor('#FFA726')
            : HexColor('#EF5350');

    return GestureDetector(
      onTap: () {
        Provider.of<PosProvider>(context, listen: false).selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.posTransactionDetails);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: HexColor('#E8EBE9')),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Status icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: statusColor.withAlpha(15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isSuccessful
                    ? HugeIcons.strokeRoundedCheckmarkCircle02
                    : isPending
                        ? HugeIcons.strokeRoundedClock01
                        : HugeIcons.strokeRoundedCancel01,
                size: 20,
                color: statusColor,
              ),
            ),
            const SizedBox(width: 12),
            // User details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.payerPhone ?? transaction.payerName ?? 'Unknown',
                    style: Blacks.smallestBoldPoppins,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    transaction.createdAt != null
                        ? formatDate(transaction.createdAt!)
                        : '--',
                    style: Grays.tinyPoppinsHint,
                  ),
                ],
              ),
            ),
            // Amount & Status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'KES ${formatThousands(amount: transaction.amount ?? 0)}',
                  style: Blacks.smallestBoldPoppins.copyWith(
                    color: isSuccessful ? statusColor : HexColor('#404040'),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    transaction.status ?? 'Unknown',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
