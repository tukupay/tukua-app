class PaymentMethod{
  final String method;
  final String name;
  final String? description;
  final List<String> requirements;
  final String? iconUrl;
  final PaymentMethodExample? example;

  PaymentMethod({
    required this.method,
    required this.name,
    this.description,
    required this.requirements,
    this.iconUrl,
    this.example,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    var requirementsFromJson = json['requirements'];
    List<String> requirementsList = [];
    if (requirementsFromJson is List) {
      requirementsList = List<String>.from(requirementsFromJson.map((item) => item.toString()));
    }

    return PaymentMethod(
      method: json['method'],
      name: json['name'],
      description: json['description'],
      requirements: requirementsList,
      iconUrl: json['icon_url'],
      example: json['example'] != null && json['example'] is Map<String, dynamic>
          ? PaymentMethodExample.fromJson(json['example'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PaymentMethodExample {
  final String paymentMethod;
  final int? sourceWalletId;

  PaymentMethodExample({
    required this.paymentMethod,
    this.sourceWalletId,
  });

  factory PaymentMethodExample.fromJson(Map<String, dynamic> json) {
    return PaymentMethodExample(
      paymentMethod: json['payment_method'],
      sourceWalletId: json['source_wallet_id'],
    );
  }

}