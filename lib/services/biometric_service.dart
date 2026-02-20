import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';

class BiometricService{
  final LocalAuthentication _auth=LocalAuthentication();

  Future<bool> canAuthenticate() async{
    try{
      final bool canCheckBiometrics=await _auth.canCheckBiometrics;
      final bool isDeviceSupported=await _auth.isDeviceSupported();
      return canCheckBiometrics && isDeviceSupported;
    } on PlatformException catch(e){
      debugPrint("ERROR CHECKING BIOMETRICS AVAILABILITY: $e");
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableBiometrics()async{
    try{
      final List<BiometricType> availableBiometrics=await _auth.getAvailableBiometrics();
      return availableBiometrics;
    }catch(e){
      debugPrint("ERROR GETTING AVAILABLE BIOMETRICS: $e");
      return [];
    }
  }

  Future<bool> authenticate({required String localizedReason})async{
    final bool canAuth = await canAuthenticate();
    if(!canAuth){
      debugPrint("DEVICE CANNOT USE BIOMETRICS OR NO BIOMETRICS ENROLLED");
      return false;
    }else{
      try{
        return await _auth.authenticate(localizedReason:localizedReason,
            authMessages: const<AuthMessages>[
              AndroidAuthMessages(
                  signInTitle: "Biometric Login",
                  biometricHint: "Verify your identity"
              ),
              // IOSAuth(),
            ],
            options: const AuthenticationOptions(
                stickyAuth: true,
                biometricOnly: false
            )
        );
      }on PlatformException catch(e){
        debugPrint("ERROR DURING BIOMETRIC AUTH: $e");
        if(e.code=="NotEnrolled"){
          debugPrint("NO BIOMETRICS ENROLLED ON THIS DEVICE");
        }else if(e.code=="LockedOut" || e.code=="PermanentlyLockedOut"){
          debugPrint("BIOMETRIC AUTH LOCKED OUT");
        }
        return false;
      }
    }
  }

  Future<void> stopAuthentication()async{
    await _auth.stopAuthentication();
  }
}