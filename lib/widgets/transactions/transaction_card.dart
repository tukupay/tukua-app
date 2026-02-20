import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../routes.dart';

class TransactionCard extends StatelessWidget {
  final Transaction transaction;
  const TransactionCard({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      onTap: () {
        Provider.of<TransactionsProvider>(context, listen: false)
            .selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.transactionDetails);
      },
      child: Container(
        margin: Paddings.tinyAllSides,
        padding: Paddings.tinyHorizontal,
        width: size.width,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white),
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
                  Text(transaction.description ?? 'description',
                      style: Blacks.tinyBoldGrotesk),
                  Text(
                    '${DateFormat.yMMMMd().format(transaction.createdAt!)} '
                    '${DateFormat.jm().format(transaction.createdAt!)}',
                    style: Grays.tinySemiGrotesk,
                    maxLines: 1,
                  )
                ],
              ),
            ),
            Spaces.tinySideSpace,
            Text(
              'KSH ${formatThousands(amount: transaction.amount ?? 0)}',
              style: Blacks.regularBoldGrotesk,
            ),
          ],
        ),
      ),
    );
  }
}
