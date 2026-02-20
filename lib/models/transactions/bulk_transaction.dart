import '../../models/models.dart';

/// Lightweight wrapper model for a single bulk transaction.
/// Keeps the original parsed Transaction but exposes bulk-specific
/// convenience fields (recipients, aggregate amount, sums, etc.).
class BulkTransaction {
  final Transaction transaction;
  final List<DestinationRecipient>? recipients;

  BulkTransaction({required this.transaction, this.recipients});

  /// Create from an existing Transaction instance
  factory BulkTransaction.fromTransaction(Transaction t) {
    final recipients = t.transactionMetadata?.destinationDetails?.recipients;
    return BulkTransaction(transaction: t, recipients: recipients);
  }

  /// Parse from raw JSON by delegating to Transaction.fromJson
  factory BulkTransaction.fromJson(Map<String, dynamic> json) {
    final tx = Transaction.fromJson(json);
    return BulkTransaction.fromTransaction(tx);
  }

  int? get id => transaction.id;
  int? get sourceWalletId => transaction.sourceWalletId;
  double? get amount {
    // Prefer top-level amount, then destination_details.amount, then sum of recipients
    if (transaction.amount != null) return transaction.amount;
    final destAmount = transaction.transactionMetadata?.destinationDetails?.amount;
    if (destAmount != null) return destAmount;
    if (recipients != null && recipients!.isNotEmpty) {
      return recipients!.fold<double>(0.0, (prev, r) => prev + (r.amount ?? 0.0));
    }
    return null;
  }

  String? get transactionType => transaction.transactionType;
  String? get status => transaction.status;
  String? get description => transaction.description;
  DateTime? get createdAt => transaction.createdAt;

  /// Sum recipients amounts (safe, returns 0.0 if none)
  double get recipientsSum {
    if (recipients == null || recipients!.isEmpty) return 0.0;
    return recipients!.fold<double>(0.0, (prev, r) => prev + (r.amount ?? 0.0));
  }

  /// Returns true when the transaction has recipient-level details
  bool get hasRecipients => recipients != null && recipients!.isNotEmpty;
}
