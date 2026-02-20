class Signatory{
  String phone;
  String? email;
  String? fullName;
  String? role;

  Signatory({
    required this.phone,
     this.email,
     this.fullName,
     this.role
});

  factory Signatory.fromJson(Map<String,dynamic> json){
    return Signatory(
        phone: json['phone_number'],
        email: json['email'],
        fullName: json['full_name'],
        role: json['role']);
  }

  Map<String,dynamic> toJson(){
    return {
      'phone_number': phone,
      'email': email,
      'full_name': fullName,
      'role': role
    };
  }
}