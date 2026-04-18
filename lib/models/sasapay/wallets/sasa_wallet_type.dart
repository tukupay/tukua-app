class SasaWalletType {
  String id;
  String title;
  String description;

  SasaWalletType({
    required this.id,
    required this.title,
    required this.description,
  });

  factory SasaWalletType.fromJson(Map<String, dynamic> json) {
    return SasaWalletType(
      id: json['id'],
      title: json['title'],
      description: json['description'],
    );
  }
}