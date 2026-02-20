class PosResponse {
  final int? id;
  final int? userId;
  final String? name;
  final String? type;
  final String? status;
  final String? description;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? error;

  const PosResponse({
     this.id,
     this.userId,
     this.name,
     this.type,
     this.status,
     this.description,
    this.createdAt,
    this.updatedAt,
    this.error
  });

  factory PosResponse.fromJson(Map<String, dynamic> json) {
    return PosResponse(
      id: json['id'],
      userId: json['user_id'],
      name: json['name'],
      type: json['type'],
      status: json['status'],
      description: json['description'],
      createdAt: json['created_at']!=null ?  DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null ? DateTime.parse(json['updated_at']):null,
      error: json['errors']
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'name': name,
        'type': type,
        'status': status,
        'description': description,
        'created_at': createdAt?.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
      };
}

