import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../routes.dart';

/// Modern fintech-styled transaction card with status indicators and icons
/// Used in AllTransactions page for a richer display
class EnhancedTransactionCard extends StatelessWidget {
  final Transaction transaction;
  const EnhancedTransactionCard({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final DateTime? created = transaction.createdAt;
    final String status = transaction.status ?? 'pending';
    final String type = transaction.transactionType ?? 'transfer';

    return GestureDetector(
      onTap: () {
        Provider.of<TransactionsProvider>(context, listen: false)
            .selectTransaction(transaction);
        Navigator.pushNamed(context, Routes.transactionDetails);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
        padding: const EdgeInsets.all(14),
        width: size.width,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.white, HexColor('#F8FAF9')],
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Transaction type icon
            _buildIcon(type),
            const SizedBox(width: 12),

            // Description & meta info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.description ?? 'Transaction',
                    style: Blacks.tinyBoldGrotesk.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      _typeChip(type),
                      const SizedBox(width: 8),
                      Icon(
                        HugeIcons.strokeRoundedCalendar03,
                        size: 11,
                        color: HexColor(AppColors.darkerGray2),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        created != null
                            ? DateFormat.MMMd().format(created)
                            : '-',
                        style: Grays.tinySemiGrotesk.copyWith(fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Amount & status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'KES ${formatThousands(amount: transaction.amount ?? 0)}',
                  style: Blacks.regularBoldGrotesk.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 4),
                _statusBadge(status),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon(String type) {
    final IconData icon = _getIconForType(type);

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: HexColor(AppColors.primaryGreen), size: 20),
    );
  }

  IconData _getIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'topup':
        return HugeIcons.strokeRoundedWallet01;
      case 'withdrawal':
        return HugeIcons.strokeRoundedBank;
      case 'transfer':
        return HugeIcons.strokeRoundedExchange01;
      case 'payment':
        return HugeIcons.strokeRoundedPayment01;
      case 'stk_push':
      case 'pos':
        return HugeIcons.strokeRoundedSmartPhone01;
      default:
        return HugeIcons.strokeRoundedTransaction;
    }
  }


  Widget _typeChip(String type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: HexColor('#F0F4F3'),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _formatType(type),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w500,
          color: HexColor(AppColors.darkerGray2),
        ),
      ),
    );
  }

  String _formatType(String type) {
    return type
        .split('_')
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '')
        .join(' ');
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
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 9, color: textColor),
          const SizedBox(width: 3),
          Text(
            status.substring(0, 1).toUpperCase() + status.substring(1),
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

