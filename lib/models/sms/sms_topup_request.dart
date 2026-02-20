class SmsTopUpRequest {
  final String senderId;
  final double amount;
  String? currency;

  SmsTopUpRequest({
    required this.senderId,
    required this.amount,
    this.currency,
  });

  factory SmsTopUpRequest.fromJson(Map<String, dynamic> json) {
    return SmsTopUpRequest(
      senderId: json['sender_id'],
      amount: json['amount'],
      currency: json['currency'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['sender_id'] = senderId;
    data['amount'] = amount;
    data['currency'] = currency;
    return data;
  }
}