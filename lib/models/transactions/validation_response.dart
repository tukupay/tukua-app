class ValidationResponse {
  final bool? valid;
  final List<String>? errors;
  final List<String>? warnings;
  final double? amount;
  final String? currency;
  final SourceValidation? sourceValidation;
  final bool? sufficientFunds;
  final DestinationValidation? destinationValidation;
  final StkPushValidation? stkPushValidation;
  final bool? otpSent;
  final String? paymentHash;

  ValidationResponse({
    this.valid,
    this.errors,
    this.warnings,
    this.amount,
    this.currency,
    this.sourceValidation,
    this.sufficientFunds,
    this.destinationValidation,
    this.stkPushValidation,
    this.otpSent,
    this.paymentHash
  });

  factory ValidationResponse.fromJson(Map<String, dynamic> json) {
    List<String>? parsedErrors;
    final errorsData = json['errors'];

    if (errorsData != null) {
      if (errorsData is Map<String, dynamic> && errorsData['errors'] is List) {
        parsedErrors = List<String>.from(errorsData['errors']);
      } else if (errorsData is List) {
        parsedErrors = List<String>.from(errorsData);
      }
    }

    return ValidationResponse(
      valid: json['valid'],
      errors: parsedErrors,
      warnings:
          json['warnings'] != null ? List<String>.from(json['warnings']) : null,
      sourceValidation: json['source_validation'] != null
          ? SourceValidation.fromJson(json['source_validation'])
          : null,
      sufficientFunds: json['sufficient_funds'],
      amount: json['amount'] != null ? (json['amount']).toDouble() : null,
      currency: json['currency'],
      destinationValidation: json['destination_validation'] != null
          ? DestinationValidation.fromJson(json['destination_validation'])
          : null,
      stkPushValidation: json['stk_push_validation'] != null
          ? StkPushValidation.fromJson(json['stk_push_validation'])
          : null,
      otpSent: json['otp_sent'],
      paymentHash: json['payment_hash'],
    );
  }
}

class SourceValidation {
  final ValidatedWallet? wallet;
  final String? sourceType;
  final int? sourceId;
  final double? sourceBalance;
  final String? sourceCurrency;
  final String? phoneNumber;
  final SourceCardDetails? cardDetails;
  final String? customerPhone;

  SourceValidation({
    this.wallet,
    this.sourceType,
    this.sourceId,
    this.sourceBalance,
    this.sourceCurrency,
    this.phoneNumber,
    this.cardDetails,
    this.customerPhone,
  });

  factory SourceValidation.fromJson(Map<String, dynamic> json) {
    return SourceValidation(
      wallet:
          json['wallet'] != null ? ValidatedWallet.fromJson(json['wallet']) : null,
      sourceType: json['source_type'],
      sourceId: json['source_id'],
      sourceBalance: (json['source_balance'] as num?)?.toDouble(),
      sourceCurrency: json['source_currency'],
      phoneNumber: json['phone_number'],
      cardDetails: json['card_details'] != null
          ? SourceCardDetails.fromJson(json['card_details'])
          : null,
      customerPhone: json['customer_phone'],
    );
  }
}

class StkPushValidation {
  final bool? customerPhoneValid;
  final String? phoneFormat;
  final bool? businessNameValid;
  final bool? amountValid;
  final bool? destinationWalletAccessible;

  StkPushValidation({
    this.customerPhoneValid,
    this.phoneFormat,
    this.businessNameValid,
    this.amountValid,
    this.destinationWalletAccessible,
  });

  factory StkPushValidation.fromJson(Map<String, dynamic> json) {
    return StkPushValidation(
      customerPhoneValid: json['customer_phone_valid'],
      phoneFormat: json['phone_format'],
      businessNameValid: json['business_name_valid'],
      amountValid: json['amount_valid'],
      destinationWalletAccessible: json['destination_wallet_accessible'],
    );
  }
}

class SourceCardDetails {
  final String? cardName;
  final String? cardNumberMasked;
  final int? expiryMonth;
  final int? expiryYear;

  SourceCardDetails({
    this.cardName,
    this.cardNumberMasked,
    this.expiryMonth,
    this.expiryYear,
  });

  factory SourceCardDetails.fromJson(Map<String, dynamic> json) {
    return SourceCardDetails(
      cardName: json['card_name'],
      cardNumberMasked: json['card_number_masked'],
      expiryMonth: json['expiry_month'],
      expiryYear: json['expiry_year'],
    );
  }
}

class ValidatedWallet {
  final int? id;
  final String? name;
  final double? balance;
  final String? currency;
  final bool? isActive;
  final int? walletTypeId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int? userId;

  ValidatedWallet({
    this.id,
    this.name,
    this.balance,
    this.currency,
    this.isActive,
    this.walletTypeId,
    this.createdAt,
    this.updatedAt,
    this.userId,
  });

  factory ValidatedWallet.fromJson(Map<String, dynamic> json) {
    return ValidatedWallet(
      id: json['id'],
      name: json['name'],
      balance: (json['balance'] as num?)?.toDouble(),
      currency: json['currency'],
      isActive: json['is_active'],
      walletTypeId: json['wallet_type_id'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      userId: json['user_id'],
    );
  }
}

class DestinationValidation {
  final String? destinationType;
  final int? destinationId;
  final ValidatedWallet? wallet;
  final String? destinationName;
  final String? destinationCurrency;
  final String? recipientPhone;
  final String? transferMethod;
  final String? customerPhone;
  final String? businessName;
  final String? description;

  DestinationValidation({
    this.destinationType,
    this.destinationId,
    this.wallet,
    this.destinationName,
    this.destinationCurrency,
    this.recipientPhone,
    this.transferMethod,
    this.customerPhone,
    this.businessName,
    this.description,
  });

  factory DestinationValidation.fromJson(Map<String, dynamic> json) {
    return DestinationValidation(
      destinationType: json['destination_type'],
      destinationId: json['destination_id'],
      wallet:
          json['wallet'] != null ? ValidatedWallet.fromJson(json['wallet']) : null,
      destinationName: json['destination_name'],
      destinationCurrency: json['destination_currency'],
      recipientPhone: json['recipient_phone'],
      transferMethod: json['transfer_method'],
      customerPhone: json['customer_phone'],
      businessName: json['business_name'],
      description: json['description'],
    );
  }
}
