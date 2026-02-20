class SmsStats {
  final int? totalSms;
  final int? delivered;
  final int? failed;
  final int? pending;
  final double? successRate;
  final double? failureRate;
  final DateTime? lastSmsDate;
  final String? mostCommonRecipient;
  final String? errors;

  SmsStats({
    this.totalSms,
    this.delivered,
    this.failed,
    this.pending,
    this.successRate,
    this.failureRate,
    this.lastSmsDate,
    this.mostCommonRecipient,
    this.errors
  });

  factory SmsStats.fromJson(Map<String, dynamic> json) {
    return SmsStats(
      totalSms: json['total_sms'],
      delivered: json['delivered'],
      failed: json['failed'],
      pending: json['pending'],
      successRate: json['success_rate'],
      failureRate: json['failure_rate'],
      lastSmsDate:json['last_sms_date']!=null?DateTime.parse(json['last_sms_date']):null,
      mostCommonRecipient: json['most_common_recipient'],
      errors: json['errors']
    );
  }


}

