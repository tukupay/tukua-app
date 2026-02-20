class CreditTierPricing {
  final double? amount;
  final int? smsCount;
  final double? costPerSms;
  final double? markupPercentage;
  final double? sellingPricePerSms;
  final TierInfo? tierInfo;
  String? error;

  CreditTierPricing({
    this.amount,
    this.smsCount,
    this.costPerSms,
    this.markupPercentage,
    this.sellingPricePerSms,
    this.tierInfo,
    this.error,
  });

  factory CreditTierPricing.fromJson(Map<String, dynamic> json) {
    return CreditTierPricing(
      amount: json['amount'],
      smsCount: json['sms_count'],
      costPerSms: json['cost_per_sms'],
      markupPercentage: json['markup_percentage'],
      sellingPricePerSms: json['selling_price_per_sms'],
      tierInfo: json['tier_info']!=null
          ? TierInfo.fromJson(json['tier_info'] as Map<String, dynamic>)
          : null,
      error: json['errors']
    );
  }

}

class TierInfo {
  final int minVolume;
  final int maxVolume;
  final double costPerSms;
  final double markupPercentage;
  final int id;
  final double sellingPricePerSms;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TierInfo({
    required this.minVolume,
    required this.maxVolume,
    required this.costPerSms,
    required this.markupPercentage,
    required this.id,
    required this.sellingPricePerSms,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory TierInfo.fromJson(Map<String, dynamic> json) {
    return TierInfo(
      minVolume: json['min_volume'],
      maxVolume: json['max_volume'],
      costPerSms: json['cost_per_sms'],
      markupPercentage: json['markup_percentage'],
      id: json['id'],
      sellingPricePerSms: json['selling_price_per_sms'],
      isActive: json['is_active'],
    );
  }
}

