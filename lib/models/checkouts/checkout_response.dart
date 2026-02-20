class CheckoutResponse {
  final int? id;
  final int? ownerId;
  final int? walletId;
  final String? title;
  final String? description;
  final double? amount;
  final String? currency;
  final String? linkType;
  final String? linkCode;
  final String? status;
  final bool? isVariableAmount;
  final double? minAmount;
  final double? maxAmount;
  final DateTime? expiresAt;
  final int? maxUses;
  final int? currentUses;
  final Map<String, dynamic>? linkMetadata;
  final bool? isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final bool? isExpired;
  final bool? isUsageLimitReached;
  final bool? canBeUsed;
  final String? checkoutLinkUrl;
  final String? error;

  CheckoutResponse({
    this.id,
    this.ownerId,
    this.walletId,
    this.title,
    this.description,
    this.amount,
    this.currency,
    this.linkType,
    this.linkCode,
    this.status,
    this.isVariableAmount,
    this.minAmount,
    this.maxAmount,
    this.expiresAt,
    this.maxUses,
    this.currentUses,
    this.linkMetadata,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.isExpired,
    this.isUsageLimitReached,
    this.canBeUsed,
    this.checkoutLinkUrl,
    this.error,
  });

  factory CheckoutResponse.fromJson(Map<String, dynamic> json) {
    return CheckoutResponse(
      id: json['id'],
      ownerId: json['owner_id'],
      walletId: json['wallet_id'],
      title: json['title'],
      description: json['description'],
      amount: (json['amount'] as num?)?.toDouble(),
      currency: json['currency'],
      linkType: json['link_type'],
      linkCode: json['link_code'],
      status: json['status'],
      isVariableAmount: json['is_variable_amount'],
      minAmount: (json['min_amount'] as num?)?.toDouble(),
      maxAmount: (json['max_amount'] as num?)?.toDouble(),
      expiresAt: json['expires_at'] == null ? null : DateTime.tryParse(json['expires_at']),
      maxUses: json['max_uses'],
      currentUses: json['current_uses'],
      linkMetadata: json['link_metadata'] as Map<String, dynamic>?,
      isActive: json['is_active'],
      createdAt: json['created_at'] == null ? null : DateTime.tryParse(json['created_at']),
      updatedAt: json['updated_at'] == null ? null : DateTime.tryParse(json['updated_at']),
      isExpired: json['is_expired'],
      isUsageLimitReached: json['is_usage_limit_reached'],
      canBeUsed: json['can_be_used'],
      checkoutLinkUrl: json['checkout_link_url'],
      error: json['errors'],
    );
  }
}
