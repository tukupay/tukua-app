class SmsTopUpResponse {
  final String? transactionId;
  final String? senderId;
  final double? amount;
  final String? currency;
  final int? creditsAllocated;
  final String? status;
  final String? message;
  final DateTime? timestamp;
  String? error;

  SmsTopUpResponse({
     this.transactionId,
     this.senderId,
     this.amount,
     this.currency,
     this.creditsAllocated,
     this.status,
     this.message,
     this.timestamp,
    this.error
  });

  factory SmsTopUpResponse.fromJson(Map<String, dynamic> json) {
    return SmsTopUpResponse(
        transactionId: json['transaction_id'],
        senderId: json['sender_id'],
        amount: json['amount'],
        currency: json['currency'],
        creditsAllocated: json['credits_allocated'],
        status: json['status'],
        message: json['message'],
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'])
            : null,
        error: json['errors']);
  }
}