class BankAccount {
  int? id;
  String? bankName;
  String? maskedAccountNumber;
  String? accountName;
  bool? isActive;

  BankAccount({
    this.id,
    this.bankName,
    this.maskedAccountNumber,
    this.accountName,
    this.isActive,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: json['id'],
      bankName: json['bank_name'],
      maskedAccountNumber: json['masked_account_number'],
      accountName: json['account_name'],
      isActive: json['is_active'],
    );
  }
}