import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:tuku/services/services.dart';

/// Service for BankGPT iframe authentication
class BankGptService {
  static const String _iframeLoginUrl =
      'https://wtpifxicczjomwyslvgx.supabase.co/functions/v1/iframe-login';

  final LocalAuthService _localAuth = LocalAuthService();
  final LocalUserService _localUser = LocalUserService();

  /// Login to BankGPT via iframe-login endpoint
  /// Returns the BankGPT session on success, null on failure
  Future<BankGptSession?> login(String phoneNumber, String password) async {
    try {
      final response = await http.post(
        Uri.parse(_iframeLoginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone_number': phoneNumber,
          'password': password,
        }),
      );

      debugPrint('BankGPT login status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        debugPrint('BankGPT login response: $jsonData');
        return BankGptSession.fromJson(jsonData);
      } else {
        debugPrint('BankGPT login failed: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('BankGPT login error: $e');
      return null;
    }
  }

  /// Login using stored TukuPay credentials (phone from user, password from auth)
  Future<BankGptSession?> loginWithStoredCredentials() async {
    try {
      // Get phone from local user
      final user = await _localUser.getUser();
      final phone = user?.phoneNumber;

      // Get password from local auth
      final password = await _localAuth.passPhrase();

      if (phone == null || password == null) {
        debugPrint('BankGPT: No stored credentials - phone: ${phone != null}, password: ${password != null}');
        return null;
      }

      debugPrint('BankGPT: Logging in with phone: $phone');
      return login(phone, password);
    } catch (e) {
      debugPrint('BankGPT loginWithStoredCredentials error: $e');
      return null;
    }
  }
}

/// BankGPT session response model
class BankGptSession {
  final String? accessToken;
  final String? refreshToken;
  final String? tokenType;
  final BankGptUser? user;
  final List<String>? errors;

  BankGptSession({
    this.accessToken,
    this.refreshToken,
    this.tokenType,
    this.user,
    this.errors,
  });

  factory BankGptSession.fromJson(Map<String, dynamic> json) {
    // Handle nested tukupayTokens structure
    final tokens = json['tukupayTokens'] as Map<String, dynamic>?;

    return BankGptSession(
      accessToken: tokens?['access_token'] ?? json['access_token'],
      refreshToken: tokens?['refresh_token'] ?? json['refresh_token'],
      tokenType: tokens?['token_type'] ?? json['token_type'],
      user: json['user'] != null ? BankGptUser.fromJson(json['user']) : null,
      errors: json['errors'] != null
          ? List<String>.from(json['errors'])
          : null,
    );
  }

  bool get isValid => accessToken != null && accessToken!.isNotEmpty;
}

/// BankGPT user model
class BankGptUser {
  final String? id;
  final int? tukupayId;
  final String? email;
  final String? phoneNumber;
  final String? username;
  final String? type;

  BankGptUser({
    this.id,
    this.tukupayId,
    this.email,
    this.phoneNumber,
    this.username,
    this.type,
  });

  factory BankGptUser.fromJson(Map<String, dynamic> json) {
    return BankGptUser(
      id: json['id'],
      tukupayId: json['tukupay_id'],
      email: json['email'],
      phoneNumber: json['phone_number'],
      username: json['username'],
      type: json['type'],
    );
  }
}

