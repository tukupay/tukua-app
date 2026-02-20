class PaymentResponse {
  final double? amount;
  final DateTime? createdAt;
  final String? message;
  final String? paymentMethod;
  final String? status;
  final int? transactionId;
  final String? transactionType;
  // final TypeResult? typeResult;
  final String? paymentReference;
  final double? sourceWalletBalance;
  final double? destinationWalletBalance;
  final String? messageReference;
  final String? queueMessageId;
  final String? error;

  PaymentResponse({
    required this.amount,
    required this.createdAt,
    required this.message,
    required this.paymentMethod,
    required this.status,
    required this.transactionId,
    required this.transactionType,
    // this.typeResult,
    this.paymentReference,
    this.sourceWalletBalance,
    this.destinationWalletBalance,
    this.messageReference,
    this.queueMessageId,
    this.error,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      amount: json['amount'],
      createdAt: json['created_at']!=null? DateTime.parse(json['created_at']):null,
      message: json['message'],
      paymentMethod: json['payment_method'],
      status: json['status'],
      transactionId: json['transaction_id'],
      transactionType: json['transaction_type'],
      // typeResult: TypeResult.fromJson(json['type_result']),
      paymentReference: json['payment_reference'],
      sourceWalletBalance: json['source_wallet_balance'],
      destinationWalletBalance: json['destination_wallet_balance'],
      messageReference: json['message_reference'],
      queueMessageId: json['queue_message_id'],
      error: json['errors'],
    );
  }
}

// class TypeResult {
//   final int creditsAdded;
//   final String message;
//   final int newBalance;
//   final bool success;
//
//   TypeResult({
//     required this.creditsAdded,
//     required this.message,
//     required this.newBalance,
//     required this.success,
//   });
//
//   factory TypeResult.fromJson(Map<String, dynamic> json) {
//     return TypeResult(
//       creditsAdded: json['credits_added'],
//       message: json['message'],
//       newBalance: json['new_balance'],
//       success: json['success'],
//     );
//   }
//
//   Map<String, dynamic> toJson() {
//     return {
//       'credits_added': creditsAdded,
//       'message': message,
//       'new_balance': newBalance,
//       'success': success,
//     };
//   }
// }
