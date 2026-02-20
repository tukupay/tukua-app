import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';

/// POS Transaction details screen - Shows full transaction information
class PosTransactionDetails extends StatefulWidget {
  const PosTransactionDetails({super.key});

  @override
  State<PosTransactionDetails> createState() => _PosTransactionDetailsState();
}

class _PosTransactionDetailsState extends State<PosTransactionDetails>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
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
          '${tempDir.path}/tuku_pos_receipt_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(pngBytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'TukuPay POS Receipt',
      );
    } catch (e) {
      debugPrint('Error sharing receipt: $e');
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    WidgetsBinding.instance.addPostFrameCallback((_) => _animController.forward());
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Consumer<PosProvider>(
        builder: (_, pos, __) {
          final transaction = pos.selectedTransaction;
          final isSuccessful = transaction?.status?.toLowerCase() == 'completed' ||
              transaction?.status?.toLowerCase() == 'success';
          final isPending = transaction?.status?.toLowerCase() == 'pending';

          final statusColor = isSuccessful
              ? HexColor(AppColors.primaryGreen)
              : isPending
                  ? HexColor('#FFA726')
                  : HexColor('#EF5350');

          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('gradient2.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    // App bar
                    _buildAppBar(context),
                    // Content
                    Expanded(
                      child: FadeTransition(
                        opacity: _fadeAnim,
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: RepaintBoundary(
                            key: _receiptKey,
                            child: Container(
                              color: HexColor('#F8FAF9'),
                              child: Column(
                                children: [
                                  const SizedBox(height: 8),
                                  // Status card
                                  _buildStatusCard(transaction, statusColor, isSuccessful, isPending),
                                  const SizedBox(height: 20),
                                  // Transaction details
                                  _buildDetailsCard(transaction, statusColor),
                                  const SizedBox(height: 20),
                                  // Timeline
                                  _buildTimelineCard(transaction),
                                  const SizedBox(height: 20),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Action buttons outside RepaintBoundary
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: _buildActionButtons(transaction),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withAlpha(200),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: Icon(
              HugeIcons.strokeRoundedArrowLeft01,
              color: HexColor(AppColors.primaryGreen),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Transaction Details', style: Blacks.regularBoldCodeNext),
                Text('Payment summary', style: Grays.tinyPoppinsHint),
              ],
            ),
          ),
          GestureDetector(
            onTap: _shareReceipt,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: _isSharing
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    )
                  : Icon(
                      HugeIcons.strokeRoundedShare01,
                      size: 18,
                      color: HexColor(AppColors.primaryGreen),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(dynamic transaction, Color statusColor, bool isSuccessful, bool isPending) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            statusColor,
            statusColor.withAlpha(200),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: statusColor.withAlpha(60),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Status icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isSuccessful
                  ? HugeIcons.strokeRoundedCheckmarkCircle02
                  : isPending
                      ? HugeIcons.strokeRoundedClock01
                      : HugeIcons.strokeRoundedCancel01,
              size: 40,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          // Amount
          Text(
            'KES ${formatThousands(amount: transaction?.amount ?? 0)}',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 8),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(30),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              transaction?.status?.toUpperCase() ?? 'UNKNOWN',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white,
                fontFamily: 'Inter',
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Payer info
          Text(
            transaction?.payerName ?? 'Unknown Payer',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white.withAlpha(230),
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            transaction?.payerPhone ?? '--',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withAlpha(180),
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsCard(dynamic transaction, Color statusColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(6),
            blurRadius: 16,
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
                  color: HexColor(AppColors.primaryGreen).withAlpha(12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedInvoice03,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text('Transaction Summary', style: Blacks.regularBoldGrotesk),
            ],
          ),
          const SizedBox(height: 18),
          _buildDetailRow(
            'Amount',
            'KES ${formatThousands(amount: transaction?.amount ?? 0)}',
            isBold: true,
          ),
          _buildDetailRow(
            'Date',
            '${formatDate(transaction?.createdAt ?? DateTime.now())}',
          ),
          _buildDetailRow(
            'Time',
            formatTime(transaction?.createdAt ?? DateTime.now()),
          ),
          _buildDetailRow(
            'M-Pesa Reference',
            '#${transaction?.transactionMetadata?.simulationResponse?.reference ?? 'N/A'}',
            canCopy: true,
          ),
          _buildDetailRow(
            'Bank Charges',
            '- KES 25.00',
            valueColor: HexColor(AppColors.red),
          ),
          _buildDetailRow(
            'Wallet Balance',
            'KES ${formatThousands(amount: transaction?.transactionMetadata?.destinationDetails?.wallet?.balance ?? 0)}',
            isLast: true,
            valueColor: HexColor(AppColors.primaryGreen),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    bool isLast = false,
    bool isBold = false,
    bool canCopy = false,
    Color? valueColor,
  }) {
    return Container(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
      margin: EdgeInsets.only(bottom: isLast ? 0 : 14),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                  color: HexColor('#F0F2F1'),
                ),
              ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Grays.smallestBolderPoppinsHint),
          Row(
            children: [
Text(
                value,
                style: isBold
                    ? Blacks.smallestBolderPoppins.copyWith(color: valueColor)
                    : Blacks.smallestBoldPoppins.copyWith(color: valueColor),
              ),
              if (canCopy) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: value));
                    Fluttertoast.showToast(msg: 'Copied to clipboard');
                  },
                  child: Icon(
                    HugeIcons.strokeRoundedCopy01,
                    size: 14,
                    color: HexColor(AppColors.lightGray),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(dynamic transaction) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(6),
            blurRadius: 16,
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
                  color: HexColor(AppColors.primaryGreen).withAlpha(12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedClock01,
                  color: HexColor(AppColors.primaryGreen),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text('Transaction Timeline', style: Blacks.regularBoldGrotesk),
            ],
          ),
          const SizedBox(height: 18),
          _buildTimelineItem(
            icon: HugeIcons.strokeRoundedSent,
            title: 'Payment Requested',
            time: '${formatDate(transaction?.createdAt ?? DateTime.now())}, ${formatTime(transaction?.createdAt ?? DateTime.now())}',
            isFirst: true,
          ),
          _buildTimelineItem(
            icon: HugeIcons.strokeRoundedCheckmarkCircle02,
            title: 'Transaction Completed',
            time: '${formatDate(transaction?.updatedAt ?? DateTime.now())}, ${formatTime(transaction?.updatedAt ?? DateTime.now())}',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required IconData icon,
    required String title,
    required String time,
    bool isFirst = false,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withAlpha(15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 16,
                color: HexColor(AppColors.primaryGreen),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 30,
                color: HexColor(AppColors.primaryGreen).withAlpha(30),
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
                Text(title, style: Blacks.smallestBoldPoppins),
                const SizedBox(height: 2),
                Text(time, style: Grays.tinyPoppinsHint),
                if (!isLast) const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(dynamic transaction) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () {
              final ref = transaction?.transactionMetadata?.simulationResponse?.reference ?? '';
              Clipboard.setData(ClipboardData(text: ref));
              Fluttertoast.showToast(msg: 'Reference copied');
            },
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: BorderSide(
                color: HexColor(AppColors.primaryGreen),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  HugeIcons.strokeRoundedCopy01,
                  size: 18,
                  color: HexColor(AppColors.primaryGreen),
                ),
                const SizedBox(width: 8),
                Text(
                  'Copy Ref',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: HexColor(AppColors.primaryGreen),
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: _isSharing ? null : _shareReceipt,
            style: ElevatedButton.styleFrom(
              backgroundColor: HexColor(AppColors.primaryGreen),
              disabledBackgroundColor: HexColor(AppColors.primaryGreen).withAlpha(150),
              foregroundColor: Colors.white,
              disabledForegroundColor: Colors.white70,
              padding: const EdgeInsets.symmetric(vertical: 14),
              elevation: 2,
              shadowColor: HexColor(AppColors.primaryGreen).withAlpha(40),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _isSharing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(HugeIcons.strokeRoundedShare01, size: 18),
                const SizedBox(width: 8),
                Text(
                  _isSharing ? 'Sharing...' : 'Share',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
