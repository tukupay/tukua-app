class WalletSnippet {
  final int id;
  final String name;
  final bool isActive;
  final bool isLinkedToBank;

  WalletSnippet({
    required this.id,
    required this.name,
    required this.isActive,
    required this.isLinkedToBank,
  });

  factory WalletSnippet.fromJson(Map<String, dynamic> json) {
    return WalletSnippet(
      id: json['id'],
      name: json['name'] ?? 'wallet_$json[id]',
      isActive: json['is_active'] ?? false,
      isLinkedToBank: json['is_linked_to_bank'] ?? false,
    );
  }
}