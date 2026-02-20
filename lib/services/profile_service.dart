import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';
class ProfileService implements ProfileRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<UserModel> updateIndividualProfile(Map<String, String> updates)async{
    final resp=await _http.put(Uri.parse(Profile().individual), body: json.encode(updates));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE INDIVIDUAL PROFILE SAYS $jsonData");
    final result=UserModel.fromJson(jsonData);
    return result;
  }

  @override
  Future<UserModel> updateBusinessProfile(Map<String, String> updates)async{
    final resp=await _http.put(Uri.parse(Profile().business), body: json.encode(updates));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE BUSINESS PROFILE SAYS $jsonData");
    final result=UserModel.fromJson(jsonData);
    return result;
  }
}