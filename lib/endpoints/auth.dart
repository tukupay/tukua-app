import 'package:tuku/endpoints/endpoints.dart';

class Auth{
  static const route='/auth';

  String get prefix=>'${Configs.root}$route';


  String get registerUser=>'$prefix/register';

  String get verifyPhone=>'$prefix/verify-phone';

  String get login=>'$prefix/login';

  String get userInfo=>'$prefix/me';

  String updateProfile(int id){
    return '$prefix/users/$id/profile';
  }

  String updatePassword(int id){
    return '$prefix/users/$id/password';
  }
  
  String get setPin=>'$prefix/setup-pin';

  String get resetPin=>'$prefix/reset-pin';

  String get sendEmailVerification=>'$prefix/send-email-verification';

  String get verifyEmail=>'$prefix/verify-email';

  String get sendPhoneOTP=>'$prefix/send-phone-verification';

  String get refreshToken=>'$prefix/refresh';

  String get requestPasswordReset=>'$prefix/forgot-password';

}