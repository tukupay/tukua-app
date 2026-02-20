import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';

class TransactionsService implements TransactionsRepository {
  final AuthHttp _http = AuthHttp();

  @override
  Future<TransactionSummaryResp> getMySummary() async {
    final resp = await _http.get(Uri.parse(TransactionsEndpoints().mySummary));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("TRANSACTIONS SUMMARY SAYS $jsonData");
    final result = TransactionSummaryResp.fromJson(jsonData);
    return result;
  }


  @override
  Future<TransactionsResp> getMyTransactions(int offset,DateTime start,DateTime end) async {
    final resp = await _http.get(Uri.parse(TransactionsEndpoints().myTransactions(offset,start,end)));
    debugPrint(TransactionsEndpoints().myTransactions(offset,start,end));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("TRANSACTIONS SAYS $jsonData");
    final result = TransactionsResp.fromJson(jsonData);
    return result;
  }


  @override
  Future<TransactionsResp> getPosRecents(DateTime start,DateTime end) async {
    final resp = await _http.get(Uri.parse(TransactionsEndpoints().posTransactions(0,start,end)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("POS RECENTS SAYS $jsonData");
    final result = TransactionsResp.fromJson(jsonData);
    return result;
  }

  @override
  Future<TransactionsResp> getPosTransactions(int offset,DateTime start,DateTime end) async {
    final resp = await _http.get(Uri.parse(TransactionsEndpoints().posTransactions(offset,start,end)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("POS TRANSACTIONS SAYS $jsonData");
    final result = TransactionsResp.fromJson(jsonData);
    return result;
  }

  @override
  Future<BulkTransactions> getBulkTransactions(int offset,DateTime start,DateTime end)async{
    final resp=await _http.get(Uri.parse(TransactionsEndpoints().bulkTransactions(offset,start,end)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("BULK TRANSACTIONS SAYS $jsonData");
    final result=BulkTransactions.fromJson(jsonData);
    return result;
  }
}
