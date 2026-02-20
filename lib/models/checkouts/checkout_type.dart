import 'package:flutter/foundation.dart';

class CheckoutType {
  final String value;
  final String label;
  final String description;
  final bool supportsVariableAmount;

  CheckoutType({
    required this.value,
    required this.label,
    required this.description,
    required this.supportsVariableAmount,
  });

  factory CheckoutType.fromJson(Map<String, dynamic> json) {
    return CheckoutType(
      value: json['value'] ?? '',
      label: json['label'] ?? '',
      description: json['description'] ?? '',
      supportsVariableAmount: json['supports_variable_amount'] ?? false,
    );
  }
}
