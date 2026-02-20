class PledgePaymentResponse {
  String? message;
  int? pledgeId;
  double? paymentAmount;
  String? newPaymentStatus;
  double? amountRemaining;
  String? pledgeStatus;
  String? error; // For potential error messages from the API

  PledgePaymentResponse({
    this.message,
    this.pledgeId,
    this.paymentAmount,
    this.newPaymentStatus,
    this.amountRemaining,
    this.pledgeStatus,
    this.error,
  });

  factory PledgePaymentResponse.fromJson(Map<String, dynamic> json) {
    return PledgePaymentResponse(
      message: json['message'],
      pledgeId: json['pledge_id'],
      paymentAmount: json['payment_amount'],
      newPaymentStatus: json['new_payment_status'],
      amountRemaining: json['amount_remaining'],
      pledgeStatus: json['pledge_status'],
      error: json['errors'],
    );
  }
}
