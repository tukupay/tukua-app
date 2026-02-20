import 'package:tuku/models/models.dart';

abstract class AuthRepository{
  Future<AuthResponse> register(String phone,String password,String type);

  Future<AuthResponse> verifyPhone(String phone,String otp);

  Future<AuthResponse> login(String phone,String password);

  Future<AuthResponse> sendPhoneOTP(String phone);

  Future<AuthResponse> sendEmailOTP(String email);

  Future<UserModel?> userInfo();

  Future<UserModel?> updateProfile(int userId,Map<String,String> updates);

  Future<AuthResponse> refreshToken();

  Future updateUserPassword(int userId,String currentPass,String newPass);

  Future<String> requestPasswordReset(String phone);

  Future<String?> setPin(PinRequest pin);

  Future<String?> resetPin(PinRequest pin);

}