class CheckoutRequest {
  final String linkType;
  final int walletId;
  final double amount;
  final String currency;
  final bool isVariableAmount;
  final DateTime? expiresAt;

  CheckoutRequest({
    required this.linkType,
    required this.walletId,
    required this.amount,
    this.currency = 'KES',
    this.isVariableAmount = false,
    this.expiresAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'link_type': linkType,
      'wallet_id': walletId,
      'amount': amount,
      'currency': currency,
      'is_variable_amount': isVariableAmount,
      'expires_at': expiresAt,
    };
  }
}
