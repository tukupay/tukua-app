class Country {
  int id;
  String name;
  String callingCode;

  Country({
    required this.id,
    required this.name,
    required this.callingCode,
  });

  factory Country.fromJson(Map<String, dynamic> json) {
    return Country(
      id: json['id'],
      name: json['name'],
      callingCode: json['calling_code'],
    );
  }
}