import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

class BulkTransactionDetails extends StatelessWidget {
  const BulkTransactionDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text('Bulk Payment Details', style: Blacks.mediumSemiRubik),
      ),
      body: Consumer<BulkPayProvider>(
        builder: (_, bulkPay, __) {
          final tx = bulkPay.selectedTransaction;
          if (tx == null) {
            return const Center(child: Text('No transaction selected'));
          }

          final double amount = tx.amount ?? tx.recipientsSum;
          final DateTime? created = tx.createdAt;
          final DateTime? updated = tx.transaction.updatedAt;
          final String status = tx.status ?? 'pending';
          final String walletName = tx.transaction.sourceWalletName ?? 'Wallet';
          final String reference = tx.transaction.transactionMetadata?.paymentResult?.reference ?? '-';
          final String paymentMethod = tx.transaction.transactionMetadata?.paymentMethod ?? 'wallet';
          final int recipientCount = tx.recipients?.length ?? 0;

          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: SingleChildScrollView(
              padding: Paddings.smallAllSides,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Amount Card
                  _buildAmountCard(amount, status, walletName),
                  Spaces.mediumTopSpace,

                  // Transaction Info Section
                  _buildSectionCard(
                    title: 'Transaction Info',
                    icon: HugeIcons.strokeRoundedInvoice03,
                    children: [
                      _infoRow('Status', _statusText(status), _statusColor(status)),
                      _infoRow('Type', 'Bulk Transfer', null),
                      _infoRow('Payment Method', _formatMethod(paymentMethod), null),
                      _infoRow('Source Wallet', walletName, null),
                      _infoRow('Reference', reference, null, copyable: true, context: context),
                    ],
                  ),
                  Spaces.smallTopSpace,

                  // Recipients Section
                  _buildRecipientsSection(tx.recipients ?? [], recipientCount),
                  Spaces.smallTopSpace,

                  // Timeline Section
                  _buildTimelineSection(created, updated, status),
                  Spaces.mediumTopSpace,
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAmountCard(double amount, String status, String walletName) {
    final bool isCompleted = status.toLowerCase() == 'completed';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isCompleted
              ? [HexColor('#1B5E20'), HexColor('#2E7D32')]
              : [HexColor('#E65100'), HexColor('#FF8300')],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isCompleted ? HexColor('#1B5E20') : HexColor('#E65100'))
                .withAlpha(76), // 0.3 * 255 ≈ 76
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51), // 0.2 * 255 ≈ 51
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCompleted
                  ? HugeIcons.strokeRoundedCheckmarkCircle01
                  : HugeIcons.strokeRoundedTimeQuarterPass,
              size: 32,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'KES ${formatThousands(amount: amount)}',
            style: Whites.largeSemiPoppins.copyWith(
              fontSize: 32,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'From $walletName',
            style: Whites.tinyPoppins.copyWith(
              color: Colors.white.withAlpha(204), // 0.8 * 255 ≈ 204
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: HexColor(AppColors.primaryGreen)),
              ),
              const SizedBox(width: 12),
              Text(title, style: Blacks.tinyBolderPoppins),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildRecipientsSection(List<DestinationRecipient> recipients, int count) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#E3F2FD'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedUserMultiple02,
                  size: 18,
                  color: HexColor('#1565C0'),
                ),
              ),
              const SizedBox(width: 12),
              Text('Recipients ($count)', style: Blacks.tinyBolderPoppins),
            ],
          ),
          const SizedBox(height: 16),
          if (recipients.isEmpty)
            Text('No recipient details', style: Grays.tinyPoppinsHint)
          else
            ...recipients.map((r) => _recipientTile(r)),
        ],
      ),
    );
  }

  Widget _recipientTile(DestinationRecipient recipient) {
    final bool hasError = recipient.error != null && recipient.error!.isNotEmpty;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: hasError ? HexColor('#FFEBEE') : HexColor('#F8FAF9'),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasError ? HexColor('#FFCDD2') : HexColor('#E8ECE9'),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: hasError
                  ? HexColor('#FFCDD2')
                  : HexColor(AppColors.lightFadedGreen),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              hasError
                  ? HugeIcons.strokeRoundedAlertCircle
                  : HugeIcons.strokeRoundedUser,
              size: 18,
              color: hasError
                  ? HexColor('#C62828')
                  : HexColor(AppColors.primaryGreen),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  recipient.phoneNumber ?? 'Unknown',
                  style: Blacks.tinyBoldGrotesk,
                ),
                if (recipient.destinationName != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    recipient.destinationName!,
                    style: Grays.tinySemiGrotesk.copyWith(fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (hasError) ...[
                  const SizedBox(height: 4),
                  Text(
                    recipient.error!,
                    style: TextStyle(
                      fontSize: 9,
                      color: HexColor('#C62828'),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'KES ${formatThousands(amount: recipient.amount ?? 0)}',
                style: Blacks.regularBoldGrotesk.copyWith(fontSize: 13),
              ),
              if (recipient.message != null && recipient.message!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  recipient.message!,
                  style: Grays.tinySemiGrotesk.copyWith(fontSize: 9),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineSection(DateTime? created, DateTime? updated, String status) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#FFF3E0'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedTimeQuarterPass,
                  size: 18,
                  color: HexColor('#E65100'),
                ),
              ),
              const SizedBox(width: 12),
              Text('Timeline', style: Blacks.tinyBolderPoppins),
            ],
          ),
          const SizedBox(height: 16),
          _timelineItem(
            icon: HugeIcons.strokeRoundedArrowUpRight01,
            title: 'Payment Initiated',
            time: created != null
                ? '${DateFormat.yMMMd().format(created)}, ${DateFormat.jm().format(created)}'
                : '-',
            isFirst: true,
            isLast: false,
          ),
          _timelineItem(
            icon: status.toLowerCase() == 'completed'
                ? HugeIcons.strokeRoundedCheckmarkCircle01
                : HugeIcons.strokeRoundedTimeQuarterPass,
            title: status.toLowerCase() == 'completed'
                ? 'Transaction Completed'
                : 'Processing...',
            time: updated != null
                ? '${DateFormat.yMMMd().format(updated)}, ${DateFormat.jm().format(updated)}'
                : '-',
            isFirst: false,
            isLast: true,
            isActive: status.toLowerCase() == 'completed',
          ),
        ],
      ),
    );
  }

  Widget _timelineItem({
    required IconData icon,
    required String title,
    required String time,
    required bool isFirst,
    required bool isLast,
    bool isActive = true,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isActive ? HexColor('#E8F5E9') : HexColor('#F5F5F5'),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 16,
                color: isActive
                    ? HexColor(AppColors.primaryGreen)
                    : HexColor('#9E9E9E'),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 30,
                color: HexColor('#E0E0E0'),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Blacks.tinyBoldGrotesk.copyWith(
                    color: isActive ? HexColor('#1D201E') : HexColor('#9E9E9E'),
                  ),
                ),
                const SizedBox(height: 2),
                Text(time, style: Grays.tinySemiGrotesk),
                if (!isLast) const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value, Color? valueColor,
      {bool copyable = false, BuildContext? context}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: HexColor('#F0F0F0')),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Grays.tinyPoppinsHint),
          Row(
            children: [
              Text(
                value,
                style: Blacks.tinyBoldGrotesk.copyWith(
                  color: valueColor ?? HexColor('#1D201E'),
                ),
              ),
              if (copyable && context != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: value));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Copied: $value'),
                        duration: const Duration(seconds: 1),
                      ),
                    );
                  },
                  child: Icon(
                    HugeIcons.strokeRoundedCopy01,
                    size: 14,
                    color: HexColor(AppColors.darkerGray2),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  String _statusText(String status) {
    return status.substring(0, 1).toUpperCase() + status.substring(1);
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return HexColor('#2E7D32');
      case 'pending':
        return HexColor('#F9A825');
      case 'failed':
        return HexColor('#C62828');
      default:
        return HexColor('#546E7A');
    }
  }

  String _formatMethod(String method) {
    return method
        .split('_')
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '')
        .join(' ');
  }
}
