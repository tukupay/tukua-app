class PaymentRequest {
  final TransactionData transactionData;
  final PaymentSource paymentSource;
  final String? description;
  Map<String,dynamic>? metadata;
  String? pin;
  String? otpCode;
  String? paymentHash;

  PaymentRequest({
    required this.transactionData,
    required this.paymentSource,
    this.description,
    this.metadata,
    this.pin,
    this.otpCode,
    this.paymentHash
  });

  factory PaymentRequest.fromJson(Map<String, dynamic> json) {
    return PaymentRequest(
      transactionData: TransactionData.fromJson(json['transaction_data']),
      paymentSource: PaymentSource.fromJson(json['payment_source']),
      description: json['description'],
      metadata: json['metadata'],
      pin: json['pin'],
      otpCode: json['otp_code'],
      paymentHash: json['payment_hash'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'transaction_data': transactionData.toJson(),
      'payment_source': paymentSource.toJson(),
      if (description != null) 'description': description,
      if (metadata != null) 'metadata': metadata,
      if (pin != null) 'pin': pin,
      if (otpCode != null) 'otp_code': otpCode,
      if (paymentHash != null) 'payment_hash': paymentHash,
    }..removeWhere((key, value) => value == null);
  }
}

class TransactionData {
   String transactionType;
   double amount;

  // wallet top up | product purchase | subscription
   int? destinationWalletId;

  // card
   String? serviceDescription;
   String? transferMessage;
   String? transferMethod;
   String? destinationPhone;
   String? destinationAlias;

   // my fav bank
   int? bankAccountId;
   // other bank
   String? bankName;
   String? accountNumber;
   String? accountName;
   String? branch;

   // pos additional prop
   String? businessName;
   String? description;

  TransactionData({
    required this.transactionType,
    required this.amount,
    this.destinationWalletId,
    this.serviceDescription,
    this.transferMessage,
    this.transferMethod,
    this.destinationPhone,
    this.destinationAlias,
    this.bankAccountId,
    this.bankName,
    this.accountNumber,
    this.accountName,
    this.branch,
    this.businessName,
    this.description
  });

  factory TransactionData.fromJson(Map<String, dynamic> json) {
    return TransactionData(
      transactionType: json['transaction_type'],
      amount: json['amount'],
      destinationWalletId: json['destination_wallet_id'],
      serviceDescription: json['service_description'],
      transferMessage: json['transfer_message'],
      transferMethod: json['transfer_method'],
      destinationPhone: json['destination_phone'],
      destinationAlias: json['destination_alias'],
      bankAccountId: json['bank_account_id']
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'transaction_type': transactionType,
      'amount': amount,
      if (destinationWalletId != null) 'destination_wallet_id': destinationWalletId,
      if (serviceDescription != null) 'service_description': serviceDescription,
      if (transferMessage != null) 'transfer_message': transferMessage,
      if (transferMethod != null) 'transfer_method': transferMethod,
      if (destinationPhone != null) 'destination_phone': destinationPhone,
      if (destinationAlias != null) 'destination_alias': destinationAlias,
      if (bankAccountId != null) 'bank_account_id': bankAccountId,
      if (businessName != null) 'business_name': businessName,
      if (description != null) 'description': description,
      if (bankName != null) 'bank_name': bankName,
      if (accountNumber != null) 'account_number': accountNumber,
      if (accountName != null) 'account_name': accountName,
      if (branch != null) 'branch': branch,
    }..removeWhere((key, value) => value == null);
  }
}

class PaymentSource {
  final String paymentMethod;
  final int? sourceWalletId;

  // phone payment
  final String? phoneNumber;

  // card payment
  final String? cardName;
  final String? cardNumber;
  final int? expiryMonth;
  final int? expiryYear;
  final String? cvv;

  // bank payment
  final String? bankName;
  final String? accountNumber;
  final String? accountName;

  PaymentSource({
    required this.paymentMethod,
    this.sourceWalletId,
    this.phoneNumber,
    this.cardName,
    this.cardNumber,
    this.expiryMonth,
    this.expiryYear,
    this.cvv,
    this.bankName,
    this.accountNumber,
    this.accountName,
  });

  factory PaymentSource.fromJson(Map<String, dynamic> json) {
    return PaymentSource(
      paymentMethod: json['payment_method'],
      sourceWalletId: json['source_wallet_id'],
      phoneNumber: json['phone_number'],
      cardName: json['card_name'],
      cardNumber: json['card_number'],
      expiryMonth: json['expiry_month'],
      expiryYear: json['expiry_year'],
      cvv: json['cvv'],
      bankName: json['bank_name'],
      accountNumber: json['account_number'],
      accountName: json['account_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'payment_method': paymentMethod,
      if (sourceWalletId != null) 'source_wallet_id': sourceWalletId,
      if (phoneNumber != null) 'phone_number': phoneNumber,
      if (cardName != null) 'card_name': cardName,
      if (cardNumber != null) 'card_number': cardNumber,
      if (expiryMonth != null) 'expiry_month': expiryMonth,
      if (expiryYear != null) 'expiry_year': expiryYear,
      if (cvv != null) 'cvv': cvv,
      if (bankName != null) 'bank_name': bankName,
      if (accountNumber != null) 'account_number': accountNumber,
      if (accountName != null) 'account_name': accountName,
    }..removeWhere((key, value) => value == null);
  }
}
