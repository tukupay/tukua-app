import '../models.dart';
class TransactionTypeResponse{
  List<TransactionType>? transactionTypes;
  String? error;

  TransactionTypeResponse({
    this.transactionTypes,
    this.error,
  });

  factory TransactionTypeResponse.fromJson(Map<String, dynamic> json) {
    return TransactionTypeResponse(
      transactionTypes: (json['transaction_types'] as List)
          .map((i) => TransactionType.fromJson(i))
          .toList(),
      error: json['errors'],
    );
  }
}