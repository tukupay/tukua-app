import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import 'auth_http.dart';
import '../models/models.dart';

class SignatoryService implements SignatoryRepository{

  final AuthHttp _http = AuthHttp();

  @override
  Future<SignatoryResponse> inviteSignatory(int walletId, SignatoryRequest request)async{
    final resp=await _http.post(Uri.parse(Signatories().invite(walletId)),
    body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("INVITE SIGNATORY SAYS $jsonData");
    final result=SignatoryResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> removeSignatory(int walletId)async{
    final resp=await _http.delete(Uri.parse(Signatories().remove(walletId)));
    final data=resp.body;
    if(data.isNotEmpty){
      final jsonData=json.decode(data);
      debugPrint("REMOVE SIGNATORY SAYS $jsonData");
      final result=jsonData['message'] as String?;
      return result;
    }else{
      return null;
    }
  }

  @override
  Future<SignatoryResponse> updateRole(int walletId, int signatoryId, String role)async{
    final resp = await _http.put(Uri.parse(Signatories().updateRole(walletId, signatoryId)),
    body: json.encode({'role': role}));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE SIGNATORY ROLE SAYS $jsonData");
    final result=SignatoryResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<SignatoryResponse> updateDetails(int walletId, int signatoryId, SignatoryRequest request)async{
    final resp = await _http.patch(Uri.parse(Signatories().updateContact(walletId,signatoryId)),
    body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE SIGNATORY DETAILS SAYS $jsonData");
    final result=SignatoryResponse.fromJson(jsonData);
    return result;
  }
}