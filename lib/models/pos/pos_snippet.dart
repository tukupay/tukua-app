class PosSnippet{
  String name;
  String type;
  String status;
  String? description;
  int? walletId;

  PosSnippet({
    required this.name,
    required this.type,
    required this.status,
    this.description,
    this.walletId,
});
  factory PosSnippet.fromJson(Map<String, dynamic> json) {
    return PosSnippet(
      name: json['name'],
      type: json['type'],
      status: json['status'],
      description: json['description'],
      walletId: json['wallet_id'],
    );
  }
}