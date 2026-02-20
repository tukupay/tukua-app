import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';
import '../../routes.dart';

class BulkTransactionItem extends StatelessWidget {
  final BulkTransaction transaction;
  const BulkTransactionItem({super.key,
    required this.transaction});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final DateTime? created = transaction.createdAt;
    final double displayAmount = transaction.amount ?? transaction.recipientsSum;

    return GestureDetector(
      onTap: () {
        Provider.of<BulkPayProvider>(context, listen: false).selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.bulkTransactionDetails);
      },
      child: Container(
        margin: Paddings.tinyVertical,
        padding: Paddings.tinyHorizontal,
        width: size.width,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(8),
          color: Colors.transparent,
        ),
        child: Row(
          children: [
            Spaces.tinySideSpace,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(transaction.description ?? 'Bulk transfer', style: Blacks.tinyBoldGrotesk),
                  if (created != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${DateFormat.yMMMMd().format(created)} ${DateFormat.jm().format(created)}',
                      style: Grays.tinySemiGrotesk,
                      maxLines: 1,
                    ),
                  ]
                ],
              ),
            ),
            Spaces.tinySideSpace,
            Text('KSH ${formatThousands(amount: displayAmount)}', style: Blacks.regularBoldGrotesk),
          ],
        ),
      ),
    );
  }
}