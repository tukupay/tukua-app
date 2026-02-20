import 'package:tuku/models/models.dart';

abstract class LocalAuthRepository{

  Future<void> saveAuth(String pass,String access,String refresh);

  Future<LocalAuthModel?> updateTokens(String access,String refresh);

  Future<String?> accessToken();

  Future<String?> refreshToken();

  Future<String?> passPhrase();

  Future<void> clearTokens();
}