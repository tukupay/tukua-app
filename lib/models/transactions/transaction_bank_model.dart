class TransactionBankAccount {
  final int? id;
  final String? bankName;
  final String? accountNumber;
  final String? accountName;
  final String? branch;

  TransactionBankAccount(
      {this.id, this.bankName, this.accountNumber, this.accountName, this.branch});

  factory TransactionBankAccount.fromJson(Map<String, dynamic> json) {
    return TransactionBankAccount(
      id: json['id'],
      bankName: json['bank_name'],
      accountNumber: json['account_number'],
      accountName: json['account_name'],
      branch: json['branch'],
    );
  }
}

class SourceBankDetails {
  final String? bankName;
  final String? accountNumberMasked;
  final String? accountName;

  SourceBankDetails({this.bankName, this.accountNumberMasked, this.accountName});

  factory SourceBankDetails.fromJson(Map<String, dynamic> json) {
    return SourceBankDetails(
      bankName: json['bank_name'],
      accountNumberMasked: json['account_number_masked'],
      accountName: json['account_name'],
    );
  }
}