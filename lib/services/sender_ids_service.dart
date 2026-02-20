import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';
class SenderIdsService implements SenderIdsRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<SenderIdResponse> requestSenderId(SenderIdRequest request)async{
    final resp=await _http.post(Uri.parse(SenderId().request), body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("REQUEST SENDER ID SAYS $jsonData");
    final result=SenderIdResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<SenderIdResponse>> getSenderIdRequests()async{
    List<SenderIdResponse> requests=[];
    final resp=await _http.get(Uri.parse(SenderId().myRequests));
    final data=resp.body;
    final jsonData=json.decode(data)['requests'];
    debugPrint("GET SENDER ID REQUESTS SAYS $jsonData");
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=SenderIdResponse.fromJson(json);
        requests.add(result);
      }
    }
    return requests;
  }

  @override
  Future<UserSenderId> senderIds(int userId)async{
    final resp=await _http.get(Uri.parse(SenderId().userIds(userId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET SENDER ID SAYS $jsonData");
    final result=UserSenderId.fromJson(jsonData);
    return result;
  }
}