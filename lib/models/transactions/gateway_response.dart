class GatewayResponse {
  final String? status;
  final String? transactionId;
  final String? reference;
  final double? amount;
  final String? currency;
  final DateTime? timestamp;

  GatewayResponse(
      {this.status,
        this.transactionId,
        this.reference,
        this.amount,
        this.currency,
        this.timestamp});

  factory GatewayResponse.fromJson(Map<String, dynamic> json) {
    return GatewayResponse(
      status: json['status'],
      transactionId: json['transaction_id'],
      reference: json['reference'],
      amount: (json['amount'] as num?)?.toDouble(),
      currency: json['currency'],
      timestamp:
      json['timestamp'] != null ? DateTime.parse(json['timestamp']) : null,
    );
  }
}