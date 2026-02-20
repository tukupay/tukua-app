class ContactGroupRequest {
  final String name;
  final String? description;

  ContactGroupRequest({
    required this.name,
    this.description,
  });

  factory ContactGroupRequest.fromJson(Map<String, dynamic> json) {
    return ContactGroupRequest(
      name: json['name'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    if (description != null) {
      data['description'] = description;
    }
    return data;
  }

}

