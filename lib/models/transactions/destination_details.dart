import 'package:tuku/models/models.dart';

class DestinationDetails {
  final TransactionWallet? wallet;
  final TransactionBankAccount? bankAccount;
  final String? destinationType;
  final String? destinationName;
  final String? customerPhone;
  final String? businessName;

  // Bulk-specific / extended fields
  final List<DestinationRecipient>? recipients;
  final double? amount; // aggregate amount for bulk
  final int? destinationId;
  final String? destinationCurrency;
  final String? destinationTypePreference;

  DestinationDetails({
    this.wallet,
    this.bankAccount,
    this.destinationType,
    this.destinationName,
    this.customerPhone,
    this.businessName,
    this.recipients,
    this.amount,
    this.destinationId,
    this.destinationCurrency,
    this.destinationTypePreference,
  });

  factory DestinationDetails.fromJson(Map<String, dynamic> json) {
    // parse recipients if present
    List<DestinationRecipient>? recipientsList;
    if (json['recipients'] != null && json['recipients'] is List) {
      recipientsList = (json['recipients'] as List)
          .map((r) => DestinationRecipient.fromJson(r))
          .toList();
    }

    return DestinationDetails(
      wallet:
          json['wallet'] != null ? TransactionWallet.fromJson(json['wallet']) : null,
      bankAccount: json['bank_account'] != null
          ? TransactionBankAccount.fromJson(json['bank_account'])
          : null,
      destinationType: json['destination_type'],
      destinationName: json['destination_name'],
      customerPhone: json['customer_phone'],
      businessName: json['business_name'],
      recipients: recipientsList,
      amount: (json['amount'] as num?)?.toDouble(),
      destinationId: json['destination_id'],
      destinationCurrency: json['destination_currency'],
      destinationTypePreference: json['destination_type_preference'],
    );
  }
}

class DestinationRecipient {
  final String? phoneNumber;
  final double? amount;
  final String? message;
  final String? destinationType;
  final int? destinationId;
  final TransactionWallet? wallet;
  final String? destinationName;
  final String? destinationCurrency;
  final String? error;

  DestinationRecipient({
    this.phoneNumber,
    this.amount,
    this.message,
    this.destinationType,
    this.destinationId,
    this.wallet,
    this.destinationName,
    this.destinationCurrency,
    this.error,
  });

  factory DestinationRecipient.fromJson(Map<String, dynamic> json) {
    return DestinationRecipient(
      phoneNumber: json['phone_number'],
      amount: (json['amount'] as num?)?.toDouble(),
      message: json['message'],
      destinationType: json['destination_type'],
      destinationId: json['destination_id'],
      wallet: json['wallet'] != null ? TransactionWallet.fromJson(json['wallet']) : null,
      destinationName: json['destination_name'],
      destinationCurrency: json['destination_currency'],
      error: json['error']?.toString(),
    );
  }
}