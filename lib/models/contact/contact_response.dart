import 'package:tuku/models/models.dart';
class ContactResponse {
  final String? name;
  final String? phone;
  final String? email;
  final Meta? meta;
  final int? id;
  final int? groupId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  String? error;

  ContactResponse({
    this.name,
    this.phone,
    this.email,
    this.meta,
    this.id,
    this.groupId,
    this.createdAt,
    this.updatedAt,
    this.error
  });

  factory ContactResponse.fromJson(Map<String, dynamic> json) {
    return ContactResponse(
      name: json['name'],
      phone: json['phone'],
      email: json['email'] as String?,
      meta: json['meta'] !=null
          ? Meta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
      id: json['id'],
      groupId: json['group_id'],
      createdAt: json['created_at']!=null?DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null?DateTime.parse(json['updated_at']):null,
      error: json['errors']
    );
  }

}
