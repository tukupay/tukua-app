import '../models.dart';

class PaymentResult {
  final String? status;
  final String? paymentMethod;
  final String? reference;
  final GatewayResponse? gatewayResponse;
  final int? sourceWalletId;
  final double? newBalance;

  PaymentResult({
    this.status,
    this.paymentMethod,
    this.reference,
    this.gatewayResponse,
    this.sourceWalletId,
    this.newBalance,
  });

  factory PaymentResult.fromJson(Map<String, dynamic> json) {
    return PaymentResult(
      status: json['status'],
      paymentMethod: json['payment_method'],
      reference: json['reference'],
      gatewayResponse: json['gateway_response'] != null
          ? GatewayResponse.fromJson(json['gateway_response'])
          : null,
      sourceWalletId: json['source_wallet_id'],
      newBalance: (json['new_balance'] as num?)?.toDouble(),
    );
  }
}