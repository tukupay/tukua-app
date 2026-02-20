import '../../models/models.dart';

class TransactionsResp {
  final List<Transaction>? transactions;
  final int? total;
  final int? size;
  final int? page;
  final bool? hasMore;
  final String? error;

  TransactionsResp({
    this.transactions,
    this.total,
    this.size,
    this.page,
    this.hasMore,
    this.error,
  });

  factory TransactionsResp.fromJson(Map<String, dynamic> json) {
    var list = json['transactions'] as List?;
    List<Transaction>? transactionsList;
    if (list != null) {
      transactionsList = list.map((i) => Transaction.fromJson(i)).toList();
    }

    return TransactionsResp(
      transactions: transactionsList,
      total: json['total'],
      size: json['size'],
      page: json['page'],
      hasMore: json['has_more'],
      error: json['errors'],
    );
  }
}

