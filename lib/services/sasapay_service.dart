import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import 'auth_http.dart';
import '../models/models.dart';

class SasaPayService implements SasaPayRepository{

  final AuthHttp _http = AuthHttp();

  // CUSTOMER ONBOARDING
  @override
  Future<OnboardingInitResp> initializeCustomerOnboarding(CustomerInitRequest request)async{
    final resp = await _http.post(Uri.parse(SasaPay().customerInitial),
    body: request.toJson());
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("INITIALIZE CUSTOMER ONBOARDING SAYS $jsonData");
    return OnboardingInitResp.fromJson(jsonData);
  }


  @override
  Future<String?> confirmCustomerDetails(String requestId, String otp)async{
    final body = jsonEncode({
      "request_id": requestId,
      "otp": otp
    });
    final resp = await _http.post(Uri.parse(SasaPay().customerConfirm),
    body: body);
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CONFIRM CUSTOMER DETAILS SAYS $jsonData");
    return jsonData['errors'];
  }

  @override
  Future<String?> submitCustomerDocs()async{
    final token = await _http.token();
    final uri=Uri.parse(SasaPay().customerDocs);
    final req=http.MultipartRequest('POST', uri);
    if(token!=null){
      req.headers.addAll({
        'Authorization': 'Bearer $token',
      });
    }
    final streamed = await req.send();
    String respBody=await streamed.stream.bytesToString();
    final jsonData = json.decode(respBody);
    debugPrint("SUBMIT CUSTOMER DOCS SAYS $jsonData");
    return jsonData['errors'];
  }

  // BUSINESS ONBOARDING
  @override
  Future<OnboardingInitResp> initializeBusinessOnboarding(BusinessInitRequest request)async{
    final resp = await _http.post(Uri.parse(SasaPay().businessInitial),
    body: request.toJson());
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("INITIALIZE BUSINESS ONBOARDING SAYS $jsonData");
    return OnboardingInitResp.fromJson(jsonData);
  }

  @override
  Future<String?> confirmBusinessDetails(String requestId, String otp)async{
    final body = jsonEncode({
      "request_id": requestId,
      "otp": otp
    });
    final resp = await _http.post(Uri.parse(SasaPay().businessConfirm),
    body: body);
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CONFIRM BUSINESS DETAILS SAYS $jsonData");
    return jsonData['errors'];
  }

  @override
  Future<String?> submitBusinessDocs()async{
    final token = await _http.token();
    final uri=Uri.parse(SasaPay().businessDocs);
    final req=http.MultipartRequest('POST', uri);
    if(token!=null){
      req.headers.addAll({
        'Authorization': 'Bearer $token',
      });
    }
    final streamed = await req.send();
    String respBody=await streamed.stream.bytesToString();
    final jsonData = json.decode(respBody);
    debugPrint("SUBMIT BUSINESS DOCS SAYS $jsonData");
    return jsonData['errors'];
  }

  // biz types
  @override
  Future<List<String>> getBusinessTypes()async{
    List<String> types=[];
    final resp = await _http.get(Uri.parse(SasaPay().businessTypes));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET BUSINESS TYPES SAYS $jsonData");
    for(var item in jsonData) {
      types.add(item);
    }
    return types;
  }

  // countries
  @override
  Future<List<Country>> getCountries()async{
    List<Country> countries=[];
    final resp = await _http.get(Uri.parse(SasaPay().countries));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET COUNTRIES SAYS $jsonData");
    for(var item in jsonData) {
      countries.add(Country.fromJson(item));
    }
    return countries;
  }

  // sub regions
  @override
  Future<dynamic> subRegions(String callingCode)async{
    final resp = await _http.get(Uri.parse(SasaPay().subRegions(callingCode)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET SUB REGIONS SAYS $jsonData");
    return jsonData;
  }

  // industries
  @override
  Future<List<Industry>> getIndustries()async{
    List<Industry> industries=[];
    final resp = await _http.get(Uri.parse(SasaPay().industries));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET INDUSTRIES SAYS $jsonData");
    for(var item in jsonData) {
      industries.add(Industry.fromJson(item));
    }
    return industries;
  }

  // sub industries
  @override
  Future<dynamic> subIndustries(int industryId)async{
    final resp = await _http.get(Uri.parse(SasaPay().subIndustries(industryId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET SUB INDUSTRIES SAYS $jsonData");
    return jsonData;
  }

  // WALLET TYPES
  @override
  Future<List<SasaWalletType>> getWalletTypes()async{
    List<SasaWalletType> types=[];
    final resp = await http.get(Uri.parse(SasaPay().walletTypes));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET WALLET TYPES SAYS $jsonData");
    for(var item in jsonData) {
      types.add(SasaWalletType.fromJson(item));
    }
    return types;
  }

  // CHANNEL CODES
  @override
  Future<List<ChannelCode>> getChannelCodes()async{
    List<ChannelCode> codes=[];
    final resp = await _http.get(Uri.parse(SasaPay().channelCodes));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET CHANNEL CODES SAYS $jsonData");
    for(var item in jsonData) {
      codes.add(ChannelCode.fromJson(item));
    }
    return codes;
  }
}