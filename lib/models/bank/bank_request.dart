import 'dart:convert';

class BankRequest {
  String accountName;
  String accountNumber;
  String? branch;
  String bankName;
  bool isFavorite;


  BankRequest({
    required this.accountName,
    required this.accountNumber,
    this.branch,
    required this.bankName,
    this.isFavorite = false,
  });

  factory BankRequest.fromJson(Map<String, dynamic> json) {
    return BankRequest(
      accountName: json['account_name'],
      accountNumber: json['account_number'],
      branch: json['branch'],
      bankName: json['bank_name'],
      isFavorite: json['is_favorite'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'account_name': accountName,
      'account_number': accountNumber,
      'branch':  branch,
      'bank_name': bankName,
      'is_favorite': isFavorite,
    };
    return data;
  }
}