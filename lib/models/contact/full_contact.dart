import '../models.dart';
class FullContact {
   String? name;
   String? phone;
   String? email;
  final Meta? meta;
  final int? id;
  final int? groupId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final ContactGroupResponse? group;
  String? error;

  FullContact({
    this.name,
     this.phone,
    this.email,
    this.meta,
     this.id,
    this.groupId,
    this.createdAt,
    this.updatedAt,
    this.group,
    this.error
  });

  factory FullContact.fromJson(Map<String, dynamic> json) {
    return FullContact(
      name: json['name'],
      phone: json['phone'],
      email: json['email'],
      meta: json['meta']!=null ? Meta.fromJson(json['meta'] as Map<String, dynamic>) : null,
      id: json['id'],
      groupId: json['group_id'],
      createdAt: json['created_at']!=null?DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null?DateTime.parse(json['updated_at']):null,
      group: json['group']!=null ? ContactGroupResponse.fromJson(json['group'] as Map<String, dynamic>) : null,
      error: json['errors']
    );
  }
}


