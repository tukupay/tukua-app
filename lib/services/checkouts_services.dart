import 'package:flutter/material.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import 'dart:convert';

import 'auth_http.dart';

class CheckoutsService implements CheckoutsRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<List<CheckoutType>> getLinkTypes()async{
    List<CheckoutType> types=[];
    final resp = await _http.get(Uri.parse(Checkouts().types));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CHECKOUT TYPES SAYS $jsonData");
    if(jsonData is List){
      for(final item in jsonData){
        types.add(CheckoutType.fromJson(item));
      }
    }
    return types;
  }

  @override
  Future<CheckoutResponse> createCheckoutLink(CheckoutRequest request)async{
    final resp=await _http.post(Uri.parse(Checkouts().links), body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CREATE CHECKOUT SAYS $jsonData");
    final result=CheckoutResponse.fromJson(jsonData);
    return result;
  }
}