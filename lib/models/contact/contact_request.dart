import 'package:tuku/models/models.dart';
class ContactRequest {
  final String? name;
  final String? phone;
  final String? email;
  final Meta? meta;
  final int? groupId;
  final String? error;

  ContactRequest({
     this.name,
     this.phone,
    this.email,
    this.meta,
     this.groupId,
    this.error,
  });

  factory ContactRequest.fromJson(Map<String, dynamic> json) {
    return ContactRequest(
      name: json['name'],
      phone: json['phone'],
      email: json['email'],
      meta: json['meta'] !=null
          ? Meta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
      groupId: json['group_id'],
      error: json['errors']
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    data['phone'] = phone;
    if (email != null) data['email'] = email;
    if (meta != null && meta!.toJson().isNotEmpty) {
      // Only add meta if it's not null and has content
      data['meta'] = meta!.toJson();
    }
    data['group_id'] = groupId;
    return data;
  }
}


