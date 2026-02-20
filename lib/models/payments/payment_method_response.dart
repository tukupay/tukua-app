import 'package:tuku/models/models.dart';

class PaymentMethodResponse{
  List<PaymentMethod>? paymentMethods;
  String? error;
  
  PaymentMethodResponse({
    this.paymentMethods,
    this.error,
  });
  
  factory PaymentMethodResponse.fromJson(Map<String, dynamic> json) {
    return PaymentMethodResponse(
      paymentMethods: (json['payment_methods'] as List)
          .map((i) => PaymentMethod.fromJson(i))
          .toList(),
      error: json['errors'],
    );
  }
}