class FavWalletResponse {
  final int? id;
  final String? name;
  final String? phoneNumber;
  final String? walletAlias;
  final int? userId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  String? error;

  FavWalletResponse({
    this.id,
    this.name,
    this.phoneNumber,
    this.walletAlias,
    this.userId,
    this.createdAt,
    this.updatedAt,
    this.error,
  });

  factory FavWalletResponse.fromJson(Map<String, dynamic> json) {
    return FavWalletResponse(
      id: json['id'],
      name: json['name'],
      phoneNumber: json['phone_number'],
      walletAlias: json['wallet_alias'],
      userId: json['user_id'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      error: json['errors'],
    );
  }
}
