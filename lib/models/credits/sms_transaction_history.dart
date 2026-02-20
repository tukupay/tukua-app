class SmsTransactionHistory {
  final List<SmsTransactionItem>? transactions;
  final int? totalCredits;
  final int? totalDebits;
  String? error;

  SmsTransactionHistory({
     this.transactions,
     this.totalCredits,
     this.totalDebits,
    this.error
  });

  factory SmsTransactionHistory.fromJson(Map<String, dynamic> json) {
    var transactionsFromJson = json['transactions'];
    List<SmsTransactionItem> parsedTransactions = [];
    if (transactionsFromJson is List) {
      parsedTransactions = transactionsFromJson
          .map((item) =>
          SmsTransactionItem.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return SmsTransactionHistory(
      transactions: parsedTransactions,
      totalCredits: json['total_credits'],
      totalDebits: json['total_debits'],
      error: json['errors']
    );
  }
}
class SmsTransactionItem {
  final double amount;
  final int smsCount;
  final String transactionType;
  final double costPerSms;
  final String? description;
  final int id;
  final int userId;
  final int smsCreditId;
  final String? transactionId;
  final DateTime createdAt;

  SmsTransactionItem({
    required this.amount,
    required this.smsCount,
    required this.transactionType,
    required this.costPerSms,
    this.description,
    required this.id,
    required this.userId,
    required this.smsCreditId,
    this.transactionId,
    required this.createdAt,
  });

  factory SmsTransactionItem.fromJson(Map<String, dynamic> json) {
    return SmsTransactionItem(
      amount: json['amount'],
      smsCount: json['sms_count'],
      transactionType: json['transaction_type'],
      costPerSms: json['cost_per_sms'],
      description: json['description'],
      id: json['id'],
      userId: json['user_id'],
      smsCreditId: json['sms_credit_id'],
      transactionId: json['transaction_id'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}



