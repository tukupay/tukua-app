class WalletSignatory {
  String? email;
  String fullName;
  int id;
  String phoneNumber;
  String role; // admin,signatory,viewer
  String status;

  WalletSignatory({
    this.email,
    required this.fullName,
    required this.id,
    required this.phoneNumber,
    required this.role,
    required this.status,
  });

  factory WalletSignatory.fromJson(Map<String, dynamic> json) {
    return WalletSignatory(
      email: json['email'],
      fullName: json['full_name'],
      id: json['id'],
      phoneNumber: json['phone_number'],
      role: json['role'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'full_name': fullName,
      'id': id,
      'phone_number': phoneNumber,
      'role': role,
      'status': status,
    };
    if (email != null) {
      data['email'] = email;
    }
    return data;
  }
}
