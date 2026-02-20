class CreditBalance {
  final int? userId;
  final int? smsBalance;
  final double? totalSpent;
  final double? totalEarned;
  final DateTime? lastTransactionAt;
  String? error;

  CreditBalance({
    this.userId,
    this.smsBalance,
    this.totalSpent,
    this.totalEarned,
    this.lastTransactionAt,
    this.error
  });

  factory CreditBalance.fromJson(Map<String, dynamic> json) {
    return CreditBalance(
      userId: json['user_id'],
      smsBalance: json['sms_balance'],
      totalSpent: json['total_spent'],
      totalEarned: json['total_earned'],
      lastTransactionAt: json['last_transaction_at']!=null?DateTime.parse(json['last_transaction_at']):null,
      error: json['errors']
    );
  }
}


