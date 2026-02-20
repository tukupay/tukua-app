class FavWalletRequest {
  final String name;
  final String? phoneNumber;
  final String? walletAlias;

  FavWalletRequest({
    required this.name,
    this.phoneNumber,
    this.walletAlias,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'name': name,
    };
    if (phoneNumber != null) {
      data['phone_number'] = phoneNumber;
    }
    if (walletAlias != null) {
      data['wallet_alias'] = walletAlias;
    }
    return data;
  }
}
