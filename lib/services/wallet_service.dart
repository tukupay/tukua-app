import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import '../endpoints/endpoints.dart';
import '../models/models.dart';

import 'auth_http.dart';

class WalletService implements WalletRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<List<WalletType>> getWalletTypes()async{
    final resp=await _http.get(Uri.parse(Wallets().walletType));
    List<WalletType> walletTypes=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=WalletType.fromJson(json);
        walletTypes.add(result);
      }
    }
    return walletTypes;
  }

  @override
  Future<FullWallet> createWallet(WalletRequest wallet)async{
    final resp=await _http.post(Uri.parse(Wallets().createWallet), body: json.encode(wallet.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREATE WALLET SAYS $jsonData");
    final result=FullWallet.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<FullWallet>> listWallets(int userId)async{
   final resp=await _http.get(Uri.parse(Wallets().listWallets(userId)));
   List<FullWallet> wallets=[];
   final data=resp.body;
   final jsonData=json.decode(data);
   debugPrint("LIST WALLETS SAYS $jsonData");
   if(jsonData is List){
     // premium gradient pairs - fintech aesthetic matching app theme
     final List<List<String>> gradientPairs = [
       ['#15411D', '#006D69'], // earthy green - PRIMARY (app theme)
       ['#0A2F35', '#0D5C63'], // deep teal - complements green theme
       ['#1A3A3A', '#2E7D6E'], // forest emerald - nature fintech
       ['#1B2838', '#2D4A5E'], // slate blue - professional trust
       ['#2C3531', '#116466'], // dark cyan - modern & clean
       ['#1F3044', '#3D5A73'], // ocean navy - reliable & calm
       ['#2B2D42', '#5C6B8A'], // twilight slate - sophisticated
       ['#1E3D35', '#4A7C6F'], // sage green - fresh & organic
       ['#253237', '#3E6259'], // pine shadow - earthy premium
       ['#2A363B', '#4A6670'], // storm gray - neutral elegance
     ];

     int idx = 0;
     for (dynamic json in jsonData){
       final result=FullWallet.fromJson(json);
       // assign a cyclic gradient pair to the wallet's `colors` list
       final pair = gradientPairs[idx % gradientPairs.length];
       result.colors = [pair[0], pair[1]];
       // also set legacy color string for backward compatibility
       result.color = '${pair[0]},${pair[1]}';
       wallets.add(result);
       idx++;
     }
   }
   return wallets;
  }

  @override
  Future<FullWallet> getWallet(int walletId)async{
   final resp=await _http.get(Uri.parse(Wallets().getWallet(walletId)));
   final data=resp.body;
   final jsonData=json.decode(data);
   final result=FullWallet.fromJson(jsonData);
   return result;
  }

  @override
  Future<FullWallet> updateWallet(int walletId, Map<String, dynamic> updated)async{
    final resp=await _http.put(Uri.parse(Wallets().updateWallet(walletId)), body: json.encode(updated));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE WALLET SAYS $jsonData");
    final result=FullWallet.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> deleteWallet(int walletId)async{
    final resp=await _http.delete(Uri.parse(Wallets().deleteWallet(walletId)));
    final data=resp.body;
    debugPrint("DELETE WALLET SAYS $data");
    if(data.isNotEmpty){
      final jsonData=json.decode(data);
      final result=jsonData['errors'] as String?;
      return result;
    }else{
      return null;
    }
  }

  @override
  Future<String> setPrimaryWallet(int walletId)async{
    final resp=await _http.put(Uri.parse(Wallets().setPrimaryWallet(walletId)));
    final data=resp.body;
    debugPrint("SET PRIMARY WALLET SAYS $data");
    return data;
  }

  @override
  Future<WalletSearchResult> searchWallets(String query)async{
    final resp=await _http.get(Uri.parse(Wallets().search(query)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("SEARCH WALLETS SAYS $jsonData");
    final result=WalletSearchResult.fromJson(jsonData);
    return result;
  }

  @override
  Future<TransactionsResp> getWalletTransactions(int walletId, int offset,DateTime start, DateTime end)async{
    final resp = await _http.get(Uri.parse(TransactionsEndpoints().walletTransactions(walletId, offset,start,end)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET WALLET TRANSACTIONS SAYS $jsonData");
    final result = TransactionsResp.fromJson(jsonData);
    return result;
  }

  @override
  Future<FullWallet> attachBankAccount(int walletId, int bankId)async{
    final resp = await _http.post(Uri.parse(Wallets().attachBankAccount(walletId, bankId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("ATTACH BANK ACCOUNT SAYS $jsonData");
    final result = FullWallet.fromJson(jsonData);
    return result;
  }

  @override
  Future<FullWallet> detachBankAccount(int walletId)async{
    final resp = await _http.delete(Uri.parse(Wallets().detachBankAccount(walletId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("DETACH BANK ACCOUNT SAYS $jsonData");
    final result = FullWallet.fromJson(jsonData);
    return result;
  }


}