import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import 'package:http/http.dart' as http;
import 'package:tuku/services/services.dart';
import '../models/models.dart';

class AuthService implements AuthRepository{

  final headers=  {
  'Content-Type': 'application/json',
  };

  @override
  Future<AuthResponse> register(String phone, String password,String type)async{
    final resp=await http.post(Uri.parse(Auth().registerUser),
    body: jsonEncode({
      "phone_number": phone,
      "password": password,
      "type": type,
      "accepted_terms": true}),
    headers: headers);
    final data=resp.body;
    final jsonData=json.decode(data);
    final result=AuthResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<AuthResponse> verifyPhone(String phone, String otp)async{
    final resp=await http.post(Uri.parse(Auth().verifyPhone),
    body: jsonEncode({
      "phone_number": phone,
      "otp_code": otp}),
    headers: headers);
    final data=resp.body;
    final jsonData=json.decode(data);
    final result=AuthResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<AuthResponse> login(String phone, String password)async{
    final resp=await http.post(
      Uri.parse(Auth().login),
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'phone_number': phone,
        'password': password
      }),
    );
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("LOGIN RESP SAYS $jsonData");
    final result = AuthResponse.fromJson(jsonData);
    return result;
  }


  @override
  Future<AuthResponse> sendPhoneOTP(String phone)async{
    final resp=await http.post(Uri.parse(Auth().sendPhoneOTP),
    body: jsonEncode({"phone_number": phone}),
    headers: headers);
    final data=resp.body;
    final jsonData=json.decode(data);
    final result = AuthResponse.fromJson(jsonData);
    return result;
  }


  @override
  Future<AuthResponse> sendEmailOTP(String email)async{
    final resp=await http.post(Uri.parse(Auth().sendEmailVerification),
    body: jsonEncode({"email": email}),
    headers: headers);
    final data=resp.body;
    final jsonData=json.decode(data);
    final result = AuthResponse.fromJson(jsonData);
    return result;
  }


  Future<String?> getToken()async{
    final auth=LocalAuthService();
    final token=await auth.accessToken();
    return token?.trim();
  }

  @override
  Future<UserModel?> userInfo()async{
    UserModel? user;
    final token=await getToken();
    final resp=await http.get(Uri.parse(Auth().userInfo),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token'
    });
    final data=resp.body;
    final jsonData=json.decode(data);
    if(resp.statusCode==401){
      debugPrint('==> UNAUTHORIZED REQUEST <===');
    }
    if(jsonData['errors']==null){
      user=UserModel.fromJson(jsonData);
    }
    return user;
  }

  @override
  Future<UserModel?> updateProfile(int userId,Map<String,String> updates)async{
    final token=await getToken();
    final resp=await http.put(Uri.parse(Auth().updateProfile(userId)),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token'
    },
    body: jsonEncode(updates));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint('UPDATE PROFILE RESP==> $jsonData');
    if(resp.statusCode==401){
     // -> refreshToken
      // -> retry request
      debugPrint("## UNAUTHORIZED REQUEST ###");
    }
    return UserModel.fromJson(jsonData);
  }
  
  @override
  Future<AuthResponse> refreshToken()async{
    final auth=LocalAuthService();
    final stored=await auth.refreshToken();
    String refreshToken= stored!.trim();
    final resp=await http.post(Uri.parse(Auth().refreshToken),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $refreshToken'
    });
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint('REFRESH TOKEN RESP==> $jsonData');
    final result = AuthResponse.fromJson(jsonData);

    if (resp.statusCode == 200 && result.accessToken != null && result.refreshToken != null) {
      await auth.updateTokens(result.accessToken!, result.refreshToken!);
    }

    return result;
  }
  
  @override
  Future updateUserPassword(int userId, String currentPass, String newPass)async{
    final token=await getToken();
    final resp=await http.put(Uri.parse(Auth().updatePassword(userId)),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token'
    },
    body: jsonEncode({
      "current_password": currentPass,
      "new_password": newPass
    }));
    final data=resp.body;

    final jsonData=json.decode(data);
    if(resp.statusCode==401){
      // -> refreshToken??
    }
    if(jsonData['errors']==null){
      final result=UserModel.fromJson(jsonData);
      return result;
    }
    return null;
  }

  @override
  Future<String> requestPasswordReset(String phone)async{
    final resp=await http.post(Uri.parse(Auth().requestPasswordReset),
    body: jsonEncode({"phone_number": phone}),
    headers: headers);
    final data=resp.body;
    final jsonData=json.decode(data);
    return jsonData['message'];
  }

  @override
  Future<String?> setPin(PinRequest pin)async{
    final token=await getToken();
    final resp=await http.post(Uri.parse(Auth().setPin),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token'
    },
    body: jsonEncode(pin.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint('SET PIN SAYS==> $jsonData');
    return jsonData['errors'];
  }

  @override
  Future<String?> resetPin(PinRequest pin)async{
    final token=await getToken();
    final resp=await http.post(Uri.parse(Auth().resetPin),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token'
    },
    body: jsonEncode(pin.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint('RESET PIN SAYS==> $jsonData');
    return jsonData['errors'];
  }
}