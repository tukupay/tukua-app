// filepath: lib/services/auth_http.dart
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:tuku/services/services.dart';

/// Lightweight authenticated HTTP helper used across services.
class AuthHttp {
  final LocalAuthService _localAuth = LocalAuthService();
  final AuthService _authService = AuthService();

  Future<String?> _token() async {
    final token = await _localAuth.accessToken();
    return token?.trim();
  }

  /// Public token accessor which attempts a refresh if current token is null/expired.
  Future<String?> token() async {
    String? t = await _token();
    if (t == null) {
      try {
        final refreshResp = await _authService.refreshToken();
        if (refreshResp.accessToken != null) {
          t = await _token();
        }
      } catch (e) {
        debugPrint('AuthHttp.token refresh failed: $e');
      }
    }
    return t;
  }

  Future<http.Response> _retryIfUnauthorized(
      Future<http.Response> Function(String token) requestFn) async {
    String? token = await _token();
    if (token == null) {
      return http.Response('Unauthorized: no token', 401);
    }

    http.Response resp = await requestFn(token);

    if (resp.statusCode == 401) {
      debugPrint('AuthHttp: token invalid/expired; attempting refresh');
      try {
        final refreshResp = await _authService.refreshToken();
        if (refreshResp.accessToken != null) {
          // new token saved by AuthService.refreshToken -> read again
          token = await _token();
          if (token == null) return resp;
          resp = await requestFn(token);
        }
      } catch (e) {
        debugPrint('AuthHttp: refresh failed: $e');
      }
    }

    return resp;
  }

  Future<http.Response> get(Uri uri, {Map<String, String>? headers}) async {
    return _retryIfUnauthorized((token) {
      final allHeaders = <String, String>{'Content-Type': 'application/json'};
      if (headers != null) allHeaders.addAll(headers);
      allHeaders['Authorization'] = 'Bearer $token';
      return http.get(uri, headers: allHeaders);
    });
  }

  Future<http.Response> post(Uri uri,
      {Map<String, String>? headers, Object? body}) async {
    return _retryIfUnauthorized((token) {
      final allHeaders = <String, String>{'Content-Type': 'application/json'};
      if (headers != null) allHeaders.addAll(headers);
      allHeaders['Authorization'] = 'Bearer $token';
      return http.post(uri, headers: allHeaders, body: body);
    });
  }

  Future<http.Response> put(Uri uri,
      {Map<String, String>? headers, Object? body}) async {
    return _retryIfUnauthorized((token) {
      final allHeaders = <String, String>{'Content-Type': 'application/json'};
      if (headers != null) allHeaders.addAll(headers);
      allHeaders['Authorization'] = 'Bearer $token';
      return http.put(uri, headers: allHeaders, body: body);
    });
  }

  Future<http.Response> patch(Uri uri,
      {Map<String, String>? headers, Object? body}) async {
    return _retryIfUnauthorized((token) {
      final allHeaders = <String, String>{'Content-Type': 'application/json'};
      if (headers != null) allHeaders.addAll(headers);
      allHeaders['Authorization'] = 'Bearer $token';
      return http.patch(uri, headers: allHeaders, body: body);
    });
  }

  Future<http.Response> delete(Uri uri, {Map<String, String>? headers}) async {
    return _retryIfUnauthorized((token) {
      final allHeaders = <String, String>{'Content-Type': 'application/json'};
      if (headers != null) allHeaders.addAll(headers);
      allHeaders['Authorization'] = 'Bearer $token';
      return http.delete(uri, headers: allHeaders);
    });
  }
}
