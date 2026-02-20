import '../models.dart';
class SourceDetails {
  final TransactionWallet? wallet;
  final String? sourceType;
  final String? phoneNumber;
  final SourceBankDetails? bankDetails;

  SourceDetails({this.wallet, this.sourceType, this.phoneNumber, this.bankDetails});

  factory SourceDetails.fromJson(Map<String, dynamic> json) {
    return SourceDetails(
      wallet:
      json['wallet'] != null ? TransactionWallet.fromJson(json['wallet']) : null,
      sourceType: json['source_type'],
      phoneNumber: json['phone_number'],
      bankDetails: json['bank_details'] != null
          ? SourceBankDetails.fromJson(json['bank_details'])
          : null,
    );
  }
}
