class Industry {
  int id;
  String codeValue;

  Industry({
    required this.id,
    required this.codeValue,
});

  factory Industry.fromJson(Map<String, dynamic> json) {
    return Industry(
      id: json['industry_id'],
      codeValue: json['code_value']);
  }

}