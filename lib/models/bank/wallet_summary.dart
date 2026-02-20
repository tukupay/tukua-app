import 'dart:convert';

class WalletSummary {
  double balance;
  String currency;
  int id;
  bool isActive;
  int userId;

  WalletSummary({
    required this.balance,
    required this.currency,
    required this.id,
    required this.isActive,
    required this.userId,
  });

  factory WalletSummary.fromJson(Map<String, dynamic> json) {
    return WalletSummary(
      balance: (json['balance'] as num).toDouble(),
      currency: json['currency'],
      id: json['id'],
      isActive: json['is_active'],
      userId: json['user_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'balance': balance,
      'currency': currency,
      'id': id,
      'is_active': isActive,
      'user_id': userId,
    };
  }
}

// Helper functions for lists (optional)
List<WalletSummary> walletSummaryListFromJson(String str) =>
    List<WalletSummary>.from(json.decode(str).map((x) => WalletSummary.fromJson(x)));

String walletSummaryListToJson(List<WalletSummary> data) =>
    json.encode(List<dynamic>.from(data.map((x) => x.toJson())));