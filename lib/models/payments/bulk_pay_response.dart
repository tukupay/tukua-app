class BulkPayResponse {
  final double? amount;
  final DateTime? createdAt;
  final int? failedTransfers;
  final String? message;
  final String? paymentMethod;
  final String? status;
  final int? successfulTransfers;
  final int? totalRecipients;
  final int? transactionId;
  final String? transactionType;
  final List<TransferResult>? transferResults;
  final String? error;

  BulkPayResponse({
    this.amount,
    this.createdAt,
    this.failedTransfers,
    this.message,
    this.paymentMethod,
    this.status,
    this.successfulTransfers,
    this.totalRecipients,
    this.transactionId,
    this.transactionType,
    this.transferResults,
    this.error,
  });

  factory BulkPayResponse.fromJson(Map<String, dynamic> json) {
    var list = json['transfer_results'] as List?;
    List<TransferResult>? resultsList;
    if (list != null) {
      resultsList = list.map((i) => TransferResult.fromJson(i)).toList();
    }

    return BulkPayResponse(
      amount: (json['amount'] as num?)?.toDouble(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      failedTransfers: json['failed_transfers'],
      message: json['message'],
      paymentMethod: json['payment_method'],
      status: json['status'],
      successfulTransfers: json['successful_transfers'],
      totalRecipients: json['total_recipients'],
      transactionId: json['transaction_id'],
      transactionType: json['transaction_type'],
      transferResults: resultsList,
      error: json['errors'],
    );
  }
}

class TransferResult {
  final double? amount;
  final String? message;
  final String? paymentReference;
  final String? phoneNumber;
  final String? status;
  final int? transactionId;
  final String? errorCode;

  TransferResult({
    this.amount,
    this.message,
    this.paymentReference,
    this.phoneNumber,
    this.status,
    this.transactionId,
    this.errorCode,
  });

  factory TransferResult.fromJson(Map<String, dynamic> json) {
    return TransferResult(
      amount: (json['amount'] as num?)?.toDouble(),
      message: json['message'],
      paymentReference: json['payment_reference'],
      phoneNumber: json['phone_number'],
      status: json['status'],
      transactionId: json['transaction_id'],
      errorCode: json['error_code'],
    );
  }
}
