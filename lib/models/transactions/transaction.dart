import '../../models/models.dart';

class Transaction {
  final int? id;
  final int? sourceWalletId;
  final int? destinationWalletId;
  final double? amount;
  final String? transactionType;
  final String? status;
  final String? description;
  final String? message;
  final int? initiatedBy;
  final String? payerName;
  final String? payerEmail;
  final String? payerPhone;
  final TransactionMetadata? transactionMetadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? sourceWalletName;
  final String? destinationWalletName;
  final String? sourceWalletOwner;
  final String? destinationWalletOwner;

  Transaction({
    this.id,
    this.sourceWalletId,
    this.destinationWalletId,
    this.amount,
    this.transactionType,
    this.status,
    this.description,
    this.message,
    this.initiatedBy,
    this.payerName,
    this.payerEmail,
    this.payerPhone,
    this.transactionMetadata,
    this.createdAt,
    this.updatedAt,
    this.sourceWalletName,
    this.destinationWalletName,
    this.sourceWalletOwner,
    this.destinationWalletOwner,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      sourceWalletId: json['source_wallet_id'],
      destinationWalletId: json['destination_wallet_id'],
      amount: (json['amount'] as num?)?.toDouble(),
      transactionType: json['transaction_type'],
      status: json['status'],
      description: json['description'],
      message: json['message'],
      initiatedBy: json['initiated_by'],
      payerName: json['payer_name'],
      payerEmail: json['payer_email'],
      payerPhone: json['payer_phone'],
      transactionMetadata: json['transaction_metadata'] != null
          ? TransactionMetadata.fromJson(json['transaction_metadata'])
          : null,
      createdAt:
          json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt:
          json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      sourceWalletName: json['source_wallet_name'],
      destinationWalletName: json['destination_wallet_name'],
      sourceWalletOwner: json['source_wallet_owner'],
      destinationWalletOwner: json['destination_wallet_owner'],
    );
  }
}