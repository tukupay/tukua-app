import 'dart:convert';
import 'package:flutter/material.dart';

import '../endpoints/endpoints.dart';
import '../models/models.dart';
import '../repository/repository.dart';

import 'auth_http.dart';

class PaymentsService implements PaymentsRepository {
  final AuthHttp _http = AuthHttp();

  @override
  Future<TransactionTypeResponse> transactionTypes() async {
    final response = await _http.get(Uri.parse(Payment().transactionTypes));
    final data = response.body;
    final jsonData = json.decode(data);
    debugPrint("GET TRANSACTION TYPES SAYS $jsonData");
    return TransactionTypeResponse.fromJson(jsonData);
  }

  @override
  Future<PaymentMethodResponse> paymentMethods() async {
    final response = await _http.get(Uri.parse(Payment().paymentMethods));
    final data = response.body;
    final jsonData = json.decode(data);
    debugPrint("GET PAYMENT METHODS SAYS $jsonData");
    return PaymentMethodResponse.fromJson(jsonData);
  }

  @override
  Future<PaymentResponse> directPayment(PaymentRequest request) async {
    final response = await _http.post(Uri.parse(Payment().directPayment),
        body: jsonEncode(request.toJson()));
    final data = response.body;
    final jsonData = json.decode(data);
    debugPrint("DIRECT PAYMENT SAYS $jsonData");
    return PaymentResponse.fromJson(jsonData);
  }

  @override
  Future<ValidationResponse> validatePayment(PaymentRequest request) async {
    final response = await _http.post(Uri.parse(Payment().validatePayment),
        body: jsonEncode(request.toJson()));
    final data = response.body;
    final jsonData = json.decode(data);
    debugPrint("VALIDATE PAYMENT SAYS $jsonData");
    return ValidationResponse.fromJson(jsonData);
  }

  @override
  Future<BulkPayResponse> bulkTransfer(BulkPayRequest request) async {
    final response = await _http.post(Uri.parse(Payment().bulkTransfer),
        body: jsonEncode(request.toJson()));
    final data = response.body;
    final jsonData = json.decode(data);
    debugPrint("BULK TRANSFER SAYS $jsonData");
    return BulkPayResponse.fromJson(jsonData);
  }
}