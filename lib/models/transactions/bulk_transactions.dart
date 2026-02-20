import '../../models/models.dart';

class BulkTransactions {
  final List<BulkTransaction>? transactions;
  final int? total;
  final int? size;
  final int? page;
  final bool? hasMore;
  final String? error;

  BulkTransactions({
    this.transactions,
    this.total,
    this.size,
    this.page,
    this.hasMore,
    this.error,
  });

  factory BulkTransactions.fromJson(Map<String, dynamic> json) {
    var list = json['transactions'] as List?;
    List<BulkTransaction>? transactionsList;
    if (list != null) {
      transactionsList = list.map((i) => BulkTransaction.fromJson(i)).toList();
    }
    return BulkTransactions(
      transactions: transactionsList,
      total: json['total'],
      size: json['size'],
      page: json['page'],
      hasMore: json['has_more'],
      error: json['errors'],
    );
  }

}

