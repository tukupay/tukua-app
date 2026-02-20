class PosRequest{
  final String name;
  final String type;
  String? status;
  String? description;
  int? walletId;

   PosRequest({
    required this.name,
    required this.type,
     this.status,
     this.description,
     this.walletId,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'name': name,
      'type': type,
      'status': 'active',
    };
    if (walletId != null) {
      map['wallet_id'] = walletId;
    }
    if (description != null && description!.isNotEmpty) {
      map['description'] = description;
    }
    return map;
  }
}