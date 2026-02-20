class WalletType{
  int id;
  String name;
  String purpose;
  String? error;

  WalletType({
    required this.id,
    required this.name,
    required this.purpose,
    this.error
});

  factory WalletType.fromJson(Map<String,dynamic> json)=>WalletType(
    id: json['id'],
    name: json['name'],
    purpose: json['purpose_tag'],
    error: json['errors']
  );
}