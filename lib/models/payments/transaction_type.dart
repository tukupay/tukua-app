class TransactionType {
  final String type; // required
  final String name; // required
  final String? description;
  final bool destinationRequired; // required
  final String? destinationDescription;

  TransactionType({
    required this.type,
    required this.name,
    this.description,
    required this.destinationRequired,
    this.destinationDescription,
  });

  factory TransactionType.fromJson(Map<String, dynamic> json) {
    return TransactionType(
      type: json['type'],
      // Provide default or throw if critical
      name: json['name'],
      // Provide default or throw if critical
      description: json['description'],
      destinationRequired: json['destination_required'],
      // Default to false
      destinationDescription: json['destination_description'],
    );
  }
  }