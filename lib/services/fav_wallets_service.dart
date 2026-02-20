import 'package:flutter/foundation.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import 'dart:convert';

import 'auth_http.dart';

class FavWalletsService implements FavWalletsRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<FavWalletResponse> createFavWallet(FavWalletRequest fav)async{
    final resp = await _http.post(Uri.parse(FavWalletsEndpoints().favourite), body: json.encode(fav.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CREATE FAV WALLETS SAYS $jsonData");
    final result=FavWalletResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<FavWalletResponse>> getFavWallets()async{
    final resp = await _http.get(Uri.parse(FavWalletsEndpoints().favourite));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("LIST FAV WALLETS SAYS $jsonData");
    List<FavWalletResponse> favs = [];
    if (jsonData is List){
      for (dynamic json in jsonData){
        final result=FavWalletResponse.fromJson(json);
        favs.add(result);
      }
    }
    return favs;
  }

  @override
  Future<FavWalletResponse> getFavWallet(int favId)async{
    final resp = await _http.get(Uri.parse(FavWalletsEndpoints().favWallet(favId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET FAV WALLET SAYS $jsonData");
    final result=FavWalletResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<FavWalletResponse> updateFavWallet(int favId, FavWalletRequest fav)async{
    final resp = await _http.put(Uri.parse(FavWalletsEndpoints().favWallet(favId)), body: json.encode(fav.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("UPDATE FAV WALLETS SAYS $jsonData");
    final result=FavWalletResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> deleteFavWallet(int favId)async{
    final resp = await _http.delete(Uri.parse(FavWalletsEndpoints().favWallet(favId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("DELETE FAV WALLETS SAYS $jsonData");
    String? errors = jsonData['errors'];
    return errors;
  }

}