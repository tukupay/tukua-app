import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:http_parser/http_parser.dart';

import 'auth_http.dart';

class KycService implements KycRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<KycModel> uploadDocument({required String docType,
    required File selectedFile,required String fileType,required String fileExt,
  required String url})async{
    final token = await _http.token();
    final uri=Uri.parse(url);
    // multipart request
    final req= http.MultipartRequest('POST', uri);
    // add fields
    req.fields['doc_type']=docType;
    // file to upload
    final file=await http.MultipartFile.fromPath('file',
        selectedFile.path.trim(),
        contentType: MediaType(fileType, fileExt));
    req.files.add(file);
    // api request
    if(token!=null){
      req.headers.addAll({
        'Authorization': 'Bearer $token',
      });
    }
    final streamed = await req.send();
    String respBody=await streamed.stream.bytesToString();
    // parse respBody to kyc model
    final jsonData=json.decode(respBody);
    debugPrint("UPLOAD KYC SAYS $jsonData");
    final kycResp=KycModel.fromJson(jsonData);
    return kycResp;
  }

  @override
  Future<List<KycModel>?> listDocuments()async{
    final resp=await _http.get(Uri.parse(Kyc().listDocs));
    List<KycModel> kycs=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("LIST KYC SAYS $jsonData");
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=KycModel.fromJson(json);
        kycs.add(result);
      }
      return kycs;
    }
    return null;
  }

  @override
  Future<KycModel> getDocument(int id)async{
    final resp=await _http.get(Uri.parse(Kyc().getDocument(id)));
    final data=resp.body;
    final jsonData=json.decode(data);
    final result=KycModel.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> applyAnalysis(int kycId)async{
    final resp=await _http.post(Uri.parse(Kyc().applyAnalysis(kycId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    final result=jsonData['errors'] as String?;
    return result;
  }

  @override
  Future<String?> deleteDocument(int id)async {
    final resp = await _http.delete(Uri.parse(Kyc().deleteDocument(id)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("DELETE KYC SAYS $jsonData");
    final success = jsonData['errors'] as String?;
    return success;
  }
}