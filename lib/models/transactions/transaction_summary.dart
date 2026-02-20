import '../models.dart';

class TransactionSummary{
  final int totalTransactions;
  final double totalAmount; // Assuming amount can be decimal
  final int successfulTransactions;
  final int failedTransactions;
  final int pendingTransactions;
  final List<Transaction> recentTransactions;

  TransactionSummary({
    required this.totalTransactions,
    required this.totalAmount,
    required this.successfulTransactions,
    required this.failedTransactions,
    required this.pendingTransactions,
    required this.recentTransactions,
  });

  factory TransactionSummary.fromJson(Map<String, dynamic> json) {
    var list = json['recent_transactions'] as List?;
    List<Transaction> recentTransactionsList = list
        ?.map((i) => Transaction.fromJson(i as Map<String, dynamic>))
        .toList() ??
        [];

    return TransactionSummary(
      totalTransactions: json['total_transactions'] as int? ?? 0,
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      successfulTransactions: json['successful_transactions'] as int? ?? 0,
      failedTransactions: json['failed_transactions'] as int? ?? 0,
      pendingTransactions: json['pending_transactions'] as int? ?? 0,
      recentTransactions: recentTransactionsList,
    );
  }
}