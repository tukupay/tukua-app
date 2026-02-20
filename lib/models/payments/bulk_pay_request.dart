class BulkPayRequest {
  final double amount;
  final String destinationType;
  final List<BulkRecipient> recipients;
  final int sourceWalletId;
  final String transactionType;

  BulkPayRequest({
    required this.amount,
    required this.destinationType,
    required this.recipients,
    required this.sourceWalletId,
    required this.transactionType,
  });

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'destination_type': destinationType,
      'recipients': recipients.map((recipient) => recipient.toJson()).toList(),
      'source_wallet_id': sourceWalletId,
      'transaction_type': transactionType,
    };
  }
}

class BulkRecipient {
  final double amount;
  final String? message;
  final String phoneNumber;

  BulkRecipient({
    required this.amount,
    this.message,
    required this.phoneNumber,
  });

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      if (message != null) 'message': message,
      'phone_number': phoneNumber,
    };
  }
}
