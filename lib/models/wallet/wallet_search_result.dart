
class WalletSearchResult {
  final int? id;
  final String? name;
  final String? currency;
  final bool? isActive;
  final bool? isLinkedToBank;
  final bool? isPrimary;
  final bool? isTukupayWallet;
  final String? alias;
  final String? error;

  WalletSearchResult({
    this.id,
    this.name,
    this.currency,
    this.isActive,
    this.isLinkedToBank,
    this.isPrimary,
    this.isTukupayWallet,
    this.alias,
    this.error,
  });

  factory WalletSearchResult.fromJson(Map<String, dynamic> json) {
    return WalletSearchResult(
      id: json['id'],
      name: json['name'],
      currency: json['currency'],
      isActive: json['is_active'],
      isLinkedToBank: json['is_linked_to_bank'],
      isPrimary: json['is_primary'],
      isTukupayWallet: json['is_tukupay_wallet'],
      alias: json['alias'],
      error: json['errors'],
    );
  }
}
