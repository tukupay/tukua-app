class AvailableBank {
  final int id;
  final String name;
  final String? pesalinkId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  AvailableBank({
    required this.id,
    required this.name,
    this.pesalinkId,
    this.createdAt,
    this.updatedAt,
  });

  factory AvailableBank.fromJson(Map<String, dynamic> json) {
    return AvailableBank(
      id: json['id'] is int ? json['id'] as int : int.parse(json['id'].toString()),
      name: json['name']?.toString() ?? '',
      pesalinkId: json['pesalink_id']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']),
      updatedAt: DateTime.tryParse(json['updated_at']),
    );
  }
}

