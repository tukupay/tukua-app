
class FullBank {
  String? bankName;
  String? accountName;
  String? accountNumber;
  String? branch;
  int? id;
  String? maskedAccountNumber;
  bool? isActive;
  bool? isFavorite;
  DateTime? createdAt;
  DateTime? updatedAt;
  String? error;

  FullBank({
    this.accountName,
    this.accountNumber,
    this.bankName,
    this.branch,
    this.id,
    this.maskedAccountNumber,
    this.isActive,
    this.isFavorite,
    this.createdAt,
    this.updatedAt,
    this.error,
  });

  factory FullBank.fromJson(Map<String, dynamic> json) {
    return FullBank(
      accountName: json['account_name'],
      accountNumber: json['account_number'],
      bankName: json['bank_name'],
      branch: json['branch'],
      id: json['id'],
      maskedAccountNumber: json['masked_account_number'],
      isActive: json['is_active'],
      isFavorite: json['is_favourite'], // Corrected from is_favorite
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
      error: json['errors'],
    );
  }
}
