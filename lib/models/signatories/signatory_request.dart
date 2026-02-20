class SignatoryRequest {
  final String phoneNumber;
  final String email;
  final String fullName;
  final String? role;

  SignatoryRequest({
    required this.phoneNumber,
    required this.email,
    required this.fullName,
    this.role,
  });

  Map<String, dynamic> toJson() {
    return {
      'phone_number': phoneNumber,
      'email': email,
      'full_name': fullName,
      'role': role,
    };
  }

  factory SignatoryRequest.fromJson(Map<String, dynamic> json) {
    return SignatoryRequest(
      phoneNumber: json['phone_number'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      role: json['role'] as String,
    );
  }
}

