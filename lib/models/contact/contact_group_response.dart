class ContactGroupResponse {
  final String? name;
  final String? description;
  final int? id;
  final int? userId;
  int? contactCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  String? error;

  ContactGroupResponse({
     this.name,
    this.description,
     this.id,
     this.userId,
     this.contactCount,
    this.createdAt,
    this.updatedAt,
    this.error
  });

  factory ContactGroupResponse.fromJson(Map<String, dynamic> json) {
    return ContactGroupResponse(
      name: json['name'],
      description: json['description'],
      id: json['id'],
      userId: json['user_id'],
      contactCount: json['contact_count'],
      createdAt: json['created_at']!=null?DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null?DateTime.parse(json['updated_at']):null,
      error: json['errors']
    );
  }
}
