import 'dart:convert';

class Settlement {
  int amount;
  DateTime? completedAt;
  int id;
  DateTime initiatedAt;
  String settlementType;
  String status;

  Settlement({
    required this.amount,
    this.completedAt,
    required this.id,
    required this.initiatedAt,
    required this.settlementType,
    required this.status,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) {
    return Settlement(
      amount: (json['amount'] as num).toInt(),
      completedAt: json['completed_at'] == null
          ? null
          : DateTime.parse(json['completed_at']),
      id: json['id'],
      initiatedAt: DateTime.parse(json['initiated_at']),
      settlementType: json['settlement_type'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'amount': amount,
      'id': id,
      'initiated_at': initiatedAt.toIso8601String(),
      'settlement_type': settlementType,
      'status': status,
    };
    if (completedAt != null) {
      data['completed_at'] = completedAt!.toIso8601String();
    }
    return data;
  }
}

// Helper functions for lists (optional)
List<Settlement> settlementListFromJson(String str) =>
    List<Settlement>.from(json.decode(str).map((x) => Settlement.fromJson(x)));

String settlementListToJson(List<Settlement> data) =>
    json.encode(List<dynamic>.from(data.map((x) => x.toJson())));
