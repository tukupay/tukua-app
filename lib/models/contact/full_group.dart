class FullGroup {
  final String? name;
  final String? description;
  final int? id;
  final int? userId;
  int? contactCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  List<Contact>? contacts;
  String? error;

  FullGroup({
    this.name,
    this.description,
    this.id,
    this.userId,
    this.contactCount,
    this.createdAt,
    this.updatedAt,
    this.contacts,
    this.error
  });

  factory FullGroup.fromJson(Map<String, dynamic> json) {
    var contactsFromJson = json['contacts'];
    List<Contact> parsedContacts = [];
    if (contactsFromJson is List) {
      parsedContacts = contactsFromJson
          .map((item) => Contact.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return FullGroup(
      name: json['name'],
      description: json['description'],
      id: json['id'],
      userId: json['user_id'],
      contactCount: json['contact_count'],
      createdAt: json['created_at']!=null?DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null?DateTime.parse(json['updated_at']):null,
      contacts: parsedContacts,
      error: json['errors']
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    if (description != null) data['description'] = description;
    data['id'] = id;
    data['user_id'] = userId;
    data['contact_count'] = contactCount;
    if (createdAt != null) data['created_at'] = createdAt!.toIso8601String();
    if (updatedAt != null) data['updated_at'] = updatedAt!.toIso8601String();
    data['contacts'] = contacts?.map((item) => item.toJson()).toList();
    return data;
  }
}

// Class for individual contact items in the "contacts" list
class Contact {
   String name;
   String? phone;
   String? email;
  final Meta? meta;
  final int id;
  final int groupId;
  final DateTime createdAt;
  final DateTime updatedAt;

  int? amountToSend; // flag for bulk pay

  Contact({
    required this.name,
    required this.phone,
    this.email,
    this.meta,
    required this.id,
    required this.groupId,
    required this.createdAt,
    required this.updatedAt,
    this.amountToSend
  });

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      name: json['name'],
      phone: json['phone'],
      email: json['email'],
      meta: json['meta']!=null
          ? Meta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
      id: json['id'] as int? ?? 0,
      groupId: json['group_id'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    data['phone'] = phone;
    if (email != null) data['email'] = email;
    if (meta != null) data['meta'] = meta!.toJson();
    data['id'] = id;
    data['group_id'] = groupId;
    data['created_at'] = createdAt.toIso8601String();
    data['updated_at'] = updatedAt.toIso8601String();
    return data;
  }
}

class Meta {
  final String? address;
  final String? company;
  final String? notes;
  final String? position; // eg Manager

  Meta({
    this.address,
    this.company,
    this.notes,
    this.position,
  });

  factory Meta.fromJson(Map<String, dynamic> json) {
    return Meta(
      address: json['address'],
      company: json['company'],
      notes: json['notes'],
      position: json['position'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (address != null) data['address'] = address;
    if (company != null) data['company'] = company;
    if (notes != null) data['notes'] = notes;
    if (position != null) data['position'] = position;
    return data;
  }
}

