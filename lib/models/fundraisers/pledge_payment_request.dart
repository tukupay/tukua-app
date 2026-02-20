class PledgePaymentRequest{
  final double amount;
  final String paymentMethod;
  final int? walletId;
  final String? reference;
  final String? notes;

  PledgePaymentRequest({
    required this.amount,
    required this.paymentMethod,
    this.walletId,
    this.reference,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['amount'] = amount;
    data['payment_method'] = paymentMethod;
    if (walletId != null) {
      data['wallet_id'] = walletId;
    }
    if (reference != null) {
      data['reference'] = reference;
    }
    if (notes != null) {
      data['notes'] = notes;
    }
    return data;
  }
}