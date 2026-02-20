import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/models/models.dart';
import '../endpoints/endpoints.dart';
import 'auth_http.dart';

class PosService implements PosRepository {
  final AuthHttp _http = AuthHttp();

  @override
  Future<PosResponse> createProfile(PosRequest request) async {
    final resp = await _http.post(Uri.parse(PosEndpoints().prefix),
        body: json.encode(request.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CREATE PROFILE SAYS $jsonData");
    final result = PosResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<PosResponse> getProfile() {
    // TODO: implement getProfile
    throw UnimplementedError();
  }

  @override
  Future<PosResponse> updateProfile(PosRequest request)async{
    final resp = await _http.put(Uri.parse(PosEndpoints().prefix),
    body: json.encode(request.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("UPDATE PROFILE SAYS $jsonData");
    final result = PosResponse.fromJson(jsonData);
    return result;
  }
}
