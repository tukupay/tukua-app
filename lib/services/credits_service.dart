import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';

class CreditsService implements CreditsRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<CreditBalance> getCreditBalance()async{
    final resp=await _http.get(Uri.parse(Credit().balance));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREDIT BALANCE SAYS $jsonData");
    final result=CreditBalance.fromJson(jsonData);
    return result;
  }

  @override
  Future<CreditTierPricing> getCreditPricing(int amount)async{
    final resp=await _http.post(Uri.parse(Credit().pricing), body: json.encode({"sms_count":amount}));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREDIT PRICING SAYS $jsonData");
    final result=CreditTierPricing.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsTransactionHistory> getTransactionHistory()async{
    final resp=await _http.get(Uri.parse(Credit().transactions));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREDIT TRANSACTIONS SAYS $jsonData");
    final result=SmsTransactionHistory.fromJson(jsonData);
    return result;
  }

}