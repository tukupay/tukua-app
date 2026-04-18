class BusinessInitRequest {
  final String businessName;
  final String mobileNumber;
  final String email;
  final int productType;
  final int countryId;
  final int subregionId;
  final int industryId;
  final int subIndustryId;
  final String bankCode;
  final String bankAccountNumber;
  final int businessTypeId;
  final String registrationNumber;
  final String kraPin;
  final String purpose;
  final String estimatedMonthlyTransactionAmount;
  final String estimatedMonthlyTransactionCount;
  final String directors;

  BusinessInitRequest({
    required this.businessName,
    required this.mobileNumber,
    required this.email,
    required this.productType,
    required this.countryId,
    required this.subregionId,
    required this.industryId,
    required this.subIndustryId,
    required this.bankCode,
    required this.bankAccountNumber,
    required this.businessTypeId,
    required this.registrationNumber,
    required this.kraPin,
    required this.purpose,
    required this.estimatedMonthlyTransactionAmount,
    required this.estimatedMonthlyTransactionCount,
    required this.directors,
  });

  Map<String, dynamic> toJson() {
    return {
      'business_name': businessName,
      'mobile_number': mobileNumber,
      'email': email,
      'product_type': productType,
      'country_id': countryId,
      'subregion_id': subregionId,
      'industry_id': industryId,
      'sub_industry_id': subIndustryId,
      'bank_code': bankCode,
      'bank_account_number': bankAccountNumber,
      'business_type_id': businessTypeId,
      'registration_number': registrationNumber,
      'kra_pin': kraPin,
      'purpose': purpose,
      'estimated_monthly_transaction_amount':
          estimatedMonthlyTransactionAmount,
      'estimated_monthly_transaction_count':
          estimatedMonthlyTransactionCount,
      'directors': directors,
    };
  }
}