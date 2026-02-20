import 'dart:io';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:permission_handler/permission_handler.dart';
import 'package:printing/printing.dart';
import '../constants/constants.dart';
import '../models/models.dart';


class PdfGenerator {
  static final _shortDateFormat = DateFormat('dd/MM/yyyy');

  // Cache for fonts
  static pw.Font? _cachedFont;
  static pw.Font? _cachedBoldFont;

  // Load font that supports Unicode using printing package with google_fonts
  static Future<pw.Font> _loadFont() async {
    if (_cachedFont != null) return _cachedFont!;

    _cachedFont = await PdfGoogleFonts.robotoRegular();
    return _cachedFont!;
  }

  static Future<pw.Font> _loadBoldFont() async {
    if (_cachedBoldFont != null) return _cachedBoldFont!;

    _cachedBoldFont = await PdfGoogleFonts.robotoBold();
    return _cachedBoldFont!;
  }

  /// Generate PDF for wallet transactions
  static Future<void> generateWalletTransactionsPdf({
    required List<Transaction> transactions,
    required FullWallet wallet,
    required LocalUserModel user,
  }) async {
    final pdf = pw.Document();

    // Load fonts
    final font = await _loadFont();
    final fontBold = await _loadBoldFont();

    // Add page
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        theme: pw.ThemeData.withFont(
          base: font,
          bold: fontBold,
        ),
        build: (context) => [
          // Header
          _buildHeader(
            title: 'Wallet Transactions',
            subtitle: wallet.name ?? 'Wallet',
          ),
          pw.SizedBox(height: 20),

          // User & Wallet Info
          _buildInfoSection(
            title: 'Account Information',
            data: {
              'Account Holder': _getUserName(user),
              'Email': user.email ?? 'N/A',
              'Phone': user.phoneNumber ?? 'N/A',
              'Wallet': wallet.name ?? 'Wallet',
              'Balance': '${wallet.currency ?? 'KES'} ${_formatAmount(wallet.balance ?? 0)}',
              'Generated': _shortDateFormat.format(DateTime.now()),
            },
          ),
          pw.SizedBox(height: 20),

          // Transactions Table
          _buildTransactionsTable(transactions),
        ],
        footer: (context) => _buildFooter(context),
      ),
    );

    await _savePdf(pdf, 'Wallet_Transactions_${_getFilenameSafeString(wallet.name ?? 'Wallet')}');
  }

  /// Generate PDF for all transactions
  static Future<void> generateAllTransactionsPdf({
    required List<Transaction> transactions,
    required LocalUserModel user,
    TransactionSummary? summary,
  }) async {
    final pdf = pw.Document();

    // Load fonts
    final font = await _loadFont();
    final fontBold = await _loadBoldFont();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        theme: pw.ThemeData.withFont(
          base: font,
          bold: fontBold,
        ),
        build: (context) => [
          // Header
          _buildHeader(
            title: 'All Transactions',
            subtitle: 'Transaction History Report',
          ),
          pw.SizedBox(height: 20),

          // User Info
          _buildInfoSection(
            title: 'Account Information',
            data: {
              'Account Holder': _getUserName(user),
              'Email': user.email ?? 'N/A',
              'Phone': user.phoneNumber ?? 'N/A',
              'Report Date': _shortDateFormat.format(DateTime.now()),
              'Total Transactions': '${transactions.length}',
            },
          ),
          pw.SizedBox(height: 20),

          // Summary if available
          if (summary != null) ...[
            _buildSummarySection(summary),
            pw.SizedBox(height: 20),
          ],

          // Transactions Table
          _buildTransactionsTable(transactions),
        ],
        footer: (context) => _buildFooter(context),
      ),
    );

    await _savePdf(pdf, 'All_Transactions');
  }

  /// Build PDF header
  static pw.Widget _buildHeader({
    required String title,
    required String subtitle,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          'TukuPay',
          style: pw.TextStyle(
            fontSize: 24,
            fontWeight: pw.FontWeight.bold,
            color: PdfColor.fromHex('#2E7D32'),
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          title,
          style: pw.TextStyle(
            fontSize: 18,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
        pw.Text(
          subtitle,
          style: const pw.TextStyle(
            fontSize: 12,
            color: PdfColors.grey700,
          ),
        ),
        pw.SizedBox(height: 10),
        pw.Divider(thickness: 2),
      ],
    );
  }

  /// Build info section
  static pw.Widget _buildInfoSection({
    required String title,
    required Map<String, String> data,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColors.grey100,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 14,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.SizedBox(height: 8),
          ...data.entries.map(
            (entry) => pw.Padding(
              padding: const pw.EdgeInsets.symmetric(vertical: 2),
              child: pw.Row(
                children: [
                  pw.Text(
                    '${entry.key}: ',
                    style: pw.TextStyle(
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    entry.value,
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build summary section
  static pw.Widget _buildSummarySection(TransactionSummary summary) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#E8F5E9'),
        borderRadius: pw.BorderRadius.circular(8),
        border: pw.Border.all(color: PdfColor.fromHex('#2E7D32')),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            'Transaction Summary',
            style: pw.TextStyle(
              fontSize: 14,
              fontWeight: pw.FontWeight.bold,
              color: PdfColor.fromHex('#2E7D32'),
            ),
          ),
          pw.SizedBox(height: 8),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              _buildSummaryItem('Total', summary.totalAmount, null),
              _buildSummaryItem('Successful', summary.successfulTransactions.toDouble(), true),
              _buildSummaryItem('Failed', summary.failedTransactions.toDouble(), false),
            ],
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildSummaryItem(String label, double amount, bool? isPositive) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label,
          style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
        ),
        pw.Text(
          'KES ${_formatAmount(amount)}',
          style: pw.TextStyle(
            fontSize: 11,
            fontWeight: pw.FontWeight.bold,
            color: isPositive == null
                ? PdfColors.black
                : isPositive
                    ? PdfColor.fromHex('#2E7D32')
                    : PdfColor.fromHex('#D32F2F'),
          ),
        ),
      ],
    );
  }

  /// Build transactions table
  static pw.Widget _buildTransactionsTable(List<Transaction> transactions) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      columnWidths: {
        0: const pw.FlexColumnWidth(2),
        1: const pw.FlexColumnWidth(3),
        2: const pw.FlexColumnWidth(2),
        3: const pw.FlexColumnWidth(2),
      },
      children: [
        // Header row
        pw.TableRow(
          decoration: pw.BoxDecoration(
            color: PdfColor.fromHex('#2E7D32'),
          ),
          children: [
            _buildTableCell('Date', isHeader: true),
            _buildTableCell('Description', isHeader: true),
            _buildTableCell('Amount', isHeader: true),
            _buildTableCell('Status', isHeader: true),
          ],
        ),
        // Data rows
        ...transactions.map((transaction) {
          return pw.TableRow(
            children: [
              _buildTableCell(
                transaction.createdAt != null
                    ? _shortDateFormat.format(transaction.createdAt!)
                    : 'N/A',
              ),
              _buildTableCell(
                transaction.description ?? transaction.message ?? 'Transaction',
              ),
              _buildTableCell(
                'KES ${_formatAmount(transaction.amount ?? 0)}',
              ),
              _buildTableCell(
                _formatStatus(transaction.status ?? 'N/A'),
              ),
            ],
          );
        }),
      ],
    );
  }

  /// Build table cell
  static pw.Widget _buildTableCell(String text, {bool isHeader = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 10 : 9,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.white : PdfColors.black,
        ),
      ),
    );
  }

  /// Build footer
  static pw.Widget _buildFooter(pw.Context context) {
    return pw.Container(
      alignment: pw.Alignment.centerRight,
      margin: const pw.EdgeInsets.only(top: 10),
      child: pw.Text(
        'Page ${context.pageNumber} of ${context.pagesCount}',
        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey),
      ),
    );
  }

  /// Save PDF to device
  static Future<void> _savePdf(pw.Document pdf, String fileName) async {
    // Request storage permission
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }
    }

    // Get directory
    final directory = Platform.isAndroid
        ? Directory('/storage/emulated/0/Download')
        : await getApplicationDocumentsDirectory();

    // Generate unique filename
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final file = File('${directory.path}/${fileName}_$timestamp.pdf');

    // Write PDF
    await file.writeAsBytes(await pdf.save());

    // Open the PDF
    await OpenFile.open(file.path);
  }

  /// Helper methods
  static String _getUserName(LocalUserModel user) {
    if (user.type == Strings.individualAcc) {
      return '${user.firstName ?? ''} ${user.lastName ?? ''}'.trim();
    } else {
      return user.businessName ?? 'User';
    }
  }

  static String _formatAmount(double amount) {
    final formatter = NumberFormat('#,##0.00');
    return formatter.format(amount);
  }

  static String _formatStatus(String status) {
    return status.toUpperCase();
  }

  static String _getFilenameSafeString(String input) {
    return input.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');
  }
}

