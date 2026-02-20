class TransactionWallet {
  final int? id;
  final String? name;
  final double? balance;
  final String? currency;

  TransactionWallet({this.id, this.name, this.balance, this.currency});

  factory TransactionWallet.fromJson(Map<String, dynamic> json) {
    return TransactionWallet(
      id: json['id'],
      name: json['name'],
      balance: (json['balance'] as num?)?.toDouble(),
      currency: json['currency'],
    );
  }
}