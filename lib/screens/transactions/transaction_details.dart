import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class TransactionDetails extends StatefulWidget {
  const TransactionDetails({super.key});

  @override
  State<TransactionDetails> createState() => _TransactionDetailsState();
}

class _TransactionDetailsState extends State<TransactionDetails> {
  final GlobalKey _receiptKey = GlobalKey();
  bool _isSharing = false;

  Future<void> _shareReceipt() async {
    if (_isSharing) return;
    setState(() => _isSharing = true);
    try {
      final boundary = _receiptKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) return;

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;

      final Uint8List pngBytes = byteData.buffer.asUint8List();
      final tempDir = await getTemporaryDirectory();
      final file = File(
          '${tempDir.path}/tuku_receipt_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(pngBytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'TukuPay Transaction Receipt',
      );
    } catch (e) {
      debugPrint('Error sharing receipt: $e');
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text('Transaction Details', style: Blacks.mediumSemiRubik),
        actions: [
          GestureDetector(
            onTap: _shareReceipt,
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: HexColor('#F0F4F3'),
                borderRadius: BorderRadius.circular(10),
              ),
              child: _isSharing
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    )
                  : Icon(
                      HugeIcons.strokeRoundedShare01,
                      size: 20,
                      color: HexColor(AppColors.primaryGreen),
                    ),
            ),
          ),
        ],
      ),
      body: Consumer2<TransactionsProvider, PaymentsProvider>(
        builder: (_, transactions, payments, __) {
          final tx = transactions.selectedTransaction;
          if (tx == null) {
            return const Center(child: Text('No transaction selected'));
          }

          final double amount = tx.amount ?? 0;
          final DateTime? created = tx.createdAt;
          final DateTime? updated = tx.updatedAt;
          final String status = tx.status ?? 'pending';
          final String type = tx.transactionType ?? 'transfer';
          final String reference = tx.transactionMetadata?.paymentResult?.reference ?? '-';
          final String paymentMethod = tx.transactionMetadata?.paymentMethod ?? '-';
          final bool isCompleted = status.toLowerCase() == 'completed';

          // Get formatted payment method name
          String methodName = paymentMethod;
          try {
            final method = payments.paymentMethods.firstWhere(
              (el) => el.method == paymentMethod,
            );
            methodName = method.name;
          } catch (_) {
            methodName = _formatMethod(paymentMethod);
          }

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
              child: RepaintBoundary(
                key: _receiptKey,
                child: Container(
                  color: HexColor('#F8FAF9'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Amount Card
                      _buildAmountCard(amount, status, type, isCompleted),
                      Spaces.mediumTopSpace,

                      // Transaction Info Section
                      _buildSectionCard(
                        title: 'Transaction Info',
                        icon: HugeIcons.strokeRoundedInvoice03,
                        children: [
                          _infoRow('Status', _capitalize(status), _statusColor(status)),
                          _infoRow('Type', _formatType(type), null),
                          _infoRow('Payment Method', methodName, null),
                          if (tx.sourceWalletName != null)
                            _infoRow('Source Wallet', tx.sourceWalletName!, null),
                          if (tx.destinationWalletName != null)
                            _infoRow('Destination', tx.destinationWalletName!, null),
                          _infoRow('Reference', reference, null, copyable: true, context: context),
                        ],
                      ),
                      Spaces.smallTopSpace,

                      // Payer Info (if available)
                      if (tx.payerName != null || tx.payerEmail != null)
                        _buildSectionCard(
                          title: 'Payer Details',
                          icon: HugeIcons.strokeRoundedUser,
                          children: [
                            if (tx.payerName != null)
                              _infoRow('Name', tx.payerName!, null),
                            if (tx.payerEmail != null)
                              _infoRow('Email', tx.payerEmail!, null),
                            if (tx.payerPhone != null)
                              _infoRow('Phone', tx.payerPhone!, null),
                          ],
                        ),
                      if (tx.payerName != null || tx.payerEmail != null)
                        Spaces.smallTopSpace,

                      // Timeline Section
                      _buildTimelineSection(created, updated, status),
                      Spaces.mediumTopSpace,
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAmountCard(double amount, String status, String type, bool isCompleted) {
    final List<Color> gradientColors = isCompleted
        ? [HexColor('#1B5E20'), HexColor('#2E7D32')]
        : [HexColor('#E65100'), HexColor('#FF8300')];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withAlpha(76),
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
              color: Colors.white.withAlpha(51),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getIconForType(type),
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(38),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _formatType(type),
              style: Whites.tinyPoppins.copyWith(
                color: Colors.white.withAlpha(230),
                fontWeight: FontWeight.w500,
              ),
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
                overflow: TextOverflow.ellipsis,
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


  String _capitalize(String text) {
    return text.isNotEmpty
        ? text[0].toUpperCase() + text.substring(1)
        : text;
  }

  String _formatType(String type) {
    return type
        .split('_')
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '')
        .join(' ');
  }

  String _formatMethod(String method) {
    return method
        .split('_')
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '')
        .join(' ');
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
}
