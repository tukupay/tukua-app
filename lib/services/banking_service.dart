import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';

import 'auth_http.dart';

class BankingService implements BankingRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<List<AvailableBank>> availableBanks()async{
    final resp=await _http.get(Uri.parse(Banking().availableBanks));
    List<AvailableBank> banks=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    final available=jsonData['banks'];
    debugPrint("AVAILABLE BANKS SAYS $jsonData");
    if(available is List){
      for (dynamic json in available){
        banks.add(AvailableBank.fromJson(json));
      }
    }
    return banks;
  }
  @override
  Future<FullBank> createBankAccount(BankRequest bankAcc)async{
    final resp=await _http.post(Uri.parse(Banking().createBank),
        body: json.encode(bankAcc.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREATE BANK SAYS $jsonData");
    final result=FullBank.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<FullBank>> getAccountsForWallet(int walletId)async{
    final resp=await _http.get(Uri.parse(Banking().accountsForWallet(walletId)));
    List<FullBank> banks=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=FullBank.fromJson(json);
        banks.add(result);
      }
    }
    return banks;
  }

  @override
  Future<List<FullBank>> getMyBankAccounts()async{
    final resp=await _http.get(Uri.parse(Banking().myAccounts));
    List<FullBank> banks=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("MY BANKS SAYS $jsonData");
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=FullBank.fromJson(json);
        banks.add(result);
      }
    }
    return banks;
  }

  @override
  Future<FullBank> getBankAccount(int id)async{
    final resp=await _http.get(Uri.parse(Banking().getBankAccount(id)));
    final data=resp.body;
    final jsonData=json.decode(data);
    final result=FullBank.fromJson(jsonData);
    return result;
  }

  @override
  Future<FullBank> toggleFavourite(int id)async{
    final resp=await _http.post(Uri.parse(Banking().toggleFavourite(id)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("TOGGLE FAVOURITE SAYS $jsonData");
    final result=FullBank.fromJson(jsonData);
    return result;
  }

  @override
  Future<FavBanksResponse> getFavourites()async{
    final resp=await _http.get(Uri.parse(Banking().getFavourites));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET FAVOURITES SAYS $jsonData");
    final result=FavBanksResponse.fromJson(jsonData);
    return result;
  }
}