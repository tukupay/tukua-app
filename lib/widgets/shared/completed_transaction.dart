import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../routes.dart';

class CompletedTransaction extends StatefulWidget {
  final PaymentResponse payment;
  const CompletedTransaction({super.key, required this.payment});

  @override
  State<CompletedTransaction> createState() => _CompletedTransactionState();
}

class _CompletedTransactionState extends State<CompletedTransaction> {
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
    return Consumer<PaymentsProvider>(
      builder: (_, paymentsProvider, __) {
        final payment = widget.payment;
        final isPending = payment.status?.toLowerCase() == 'pending';
        final isSuccess = payment.status?.toLowerCase() == 'completed' ||
            payment.status?.toLowerCase() == 'success';

        // Color scheme based on status
        List<Color> headerGradient;
        IconData statusIcon;
        if (isSuccess) {
          headerGradient = [
            HexColor(AppColors.primaryGreen),
            HexColor(AppColors.fadedGreen),
          ];
          statusIcon = HugeIcons.strokeRoundedCheckmarkCircle01;
        } else if (isPending) {
          headerGradient = [
            HexColor(AppColors.primaryOrange),
            HexColor(AppColors.primaryOrange).withAlpha(200),
          ];
          statusIcon = HugeIcons.strokeRoundedTimeQuarterPass;
        } else {
          headerGradient = [
            HexColor(AppColors.red),
            HexColor(AppColors.red).withAlpha(180),
          ];
          statusIcon = HugeIcons.strokeRoundedAlertCircle;
        }

        final transactionTypeName = paymentsProvider.transactionTypes
                .where((el) => el.type == payment.transactionType)
                .isNotEmpty
            ? paymentsProvider.transactionTypes
                .firstWhere((el) => el.type == payment.transactionType)
                .name
            : '--';

        final paymentMethodName = paymentsProvider.paymentMethods
                .where((el) => el.method == payment.paymentMethod)
                .isNotEmpty
            ? paymentsProvider.paymentMethods
                .firstWhere((el) => el.method == payment.paymentMethod)
                .name
            : '--';

        final dateStr = payment.createdAt != null
            ? '${formatDate(payment.createdAt!, shorter: true)} at ${formatTime(payment.createdAt!)}'
            : '--';

        return SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // === SHAREABLE RECEIPT (wrapped in RepaintBoundary) ===
              RepaintBoundary(
                key: _receiptKey,
                child: Container(
                  color: Colors.white,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // ── Receipt Header ──
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            vertical: 28, horizontal: 20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: headerGradient,
                          ),
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(24)),
                        ),
                        child: Column(
                          children: [
                            // Tuku logo
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(30),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.asset(
                                  Strings.iconImage('tuku.png'),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Status icon
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(40),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withAlpha(60),
                                  width: 2,
                                ),
                              ),
                              child: Icon(
                                statusIcon,
                                size: 32,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 14),
                            // Amount
                            Text(
                              'KES ${formatThousands(amount: payment.amount ?? 0)}',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            // Status badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(35),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.white.withAlpha(50),
                                ),
                              ),
                              child: Text(
                                (payment.status ?? '--').toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              payment.message ??
                                  (isSuccess
                                      ? 'Transaction Successful'
                                      : isPending
                                          ? 'Payment Queued for Processing'
                                          : 'Transaction Failed'),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withAlpha(220),
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),

                      // ── Receipt Body ──
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        color: Colors.white,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title
                            Row(
                              children: [
                                Icon(
                                  HugeIcons.strokeRoundedInvoice03,
                                  size: 16,
                                  color: HexColor(AppColors.darkerGray2),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'TRANSACTION RECEIPT',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: HexColor(AppColors.darkerGray2),
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),

                            // Detail rows
                            if (payment.transactionId != null)
                              _ReceiptDetailRow(
                                label: 'Transaction ID',
                                value: '#${payment.transactionId}',
                              ),
                            _ReceiptDetailRow(
                              label: 'Reference',
                              value: payment.paymentReference ?? payment.messageReference ?? '--',
                            ),
                            _ReceiptDetailRow(
                              label: 'Type',
                              value: transactionTypeName,
                            ),
                            _ReceiptDetailRow(
                              label: 'Method',
                              value: paymentMethodName,
                            ),
                            _ReceiptDetailRow(
                              label: 'Date & Time',
                              value: dateStr,
                            ),
                            if (payment.sourceWalletBalance != null)
                              _ReceiptDetailRow(
                                label: 'Source Balance',
                                value:
                                    'KES ${formatThousands(amount: payment.sourceWalletBalance!)}',
                                isHighlighted: true,
                              ),
                            if (payment.destinationWalletBalance != null)
                              _ReceiptDetailRow(
                                label: 'Dest. Balance',
                                value:
                                    'KES ${formatThousands(amount: payment.destinationWalletBalance!)}',
                                isHighlighted: true,
                              ),

                            const SizedBox(height: 16),

                            // Footer branding
                            Center(
                              child: Column(
                                children: [
                                  Container(
                                    height: 1,
                                    color: HexColor('#E8ECE9'),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Powered by TukuPay',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: HexColor(AppColors.darkerGray2),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'tuku.money',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: HexColor(AppColors.primaryGreen),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // === Action Buttons (outside receipt capture) ===
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    // Share button
                    Expanded(
                      child: GestureDetector(
                        onTap: _isSharing ? null : _shareReceipt,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: HexColor(AppColors.primaryGreen),
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _isSharing
                                  ? SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color:
                                            HexColor(AppColors.primaryGreen),
                                      ),
                                    )
                                  : Icon(
                                      HugeIcons.strokeRoundedShare01,
                                      size: 18,
                                      color:
                                          HexColor(AppColors.primaryGreen),
                                    ),
                              const SizedBox(width: 8),
                              Text(
                                'Share',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: HexColor(AppColors.primaryGreen),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Done button
                    Expanded(
                      flex: 2,
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(context).popUntil((route) => route.settings.name == Routes.home || route.isFirst);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                HexColor(AppColors.primaryGreen),
                                HexColor(AppColors.fadedGreen),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: HexColor(AppColors.primaryGreen)
                                    .withAlpha(40),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'Done',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }
}


/// Receipt detail row with label-value pair
class _ReceiptDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isHighlighted;

  const _ReceiptDetailRow({
    required this.label,
    required this.value,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: HexColor(AppColors.darkerGray2),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isHighlighted
                    ? HexColor(AppColors.primaryGreen)
                    : Colors.black87,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
