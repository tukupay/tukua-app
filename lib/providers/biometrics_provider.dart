import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../services/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
class BiometricsProvider extends ChangeNotifier{
  bool _isBiometricsAvailable=false;
  bool get isBiometricsAvailable=>_isBiometricsAvailable;
  
  String? _loggedInPhoneForBiometrics;
  String? get loggedInPhoneForBiometrics=>_loggedInPhoneForBiometrics;
  
  final _secureStorage=FlutterSecureStorage();
  final _biometricService=BiometricService();

  LocalAuthService _auth=LocalAuthService();
  LocalUserService _localUser=LocalUserService();

  
  Future<void> checkBiometricsAvailability(BuildContext context)async{
    // check if user has enabled biometrics and get their identifier
    final String? phone = await _secureStorage.read(key: 'biometric_phone');
    final String? biometricEnabled = await _secureStorage.read(key: 'biometric_enabled');
    
    if(phone != null && biometricEnabled == 'true'){
      // check if device still supports and has biometrics enrolled
     final bool canAuth=await _biometricService.canAuthenticate();
     if(canAuth){
       _isBiometricsAvailable=true;
       _loggedInPhoneForBiometrics=phone;
       notifyListeners();
     }
    }
  }
  
  Future<void> biometricSetup(BuildContext context)async{
    // prompt user to enable biometrics
    final bool canAuth=await _biometricService.canAuthenticate();
    if(!canAuth) return;
    // check if new logged user.phone is different
    String? phone=await _localUser.getUser().then((value) => value?.phoneNumber);
    String? biometricPhone=await _secureStorage.read(key: 'biometric_phone');
    debugPrint("LOGGED PHONE $phone && BIOMETRIC PHONE $biometricPhone");
    if(phone!=biometricPhone){
      await _secureStorage.delete(key: 'biometric_phone');
      biometricPhone=null;
      await _secureStorage.delete(key: 'biometric_pass');
      await _secureStorage.delete(key: 'biometric_enabled');
    }
    String? biometricEnabled=await _secureStorage.read(key: 'biometric_enabled');
    // check if user has already enabled
    if(biometricPhone==null && biometricEnabled==null){
      String? phone=await _localUser.getUser().then((value) => value?.phoneNumber);
      String? pass=await _auth.passPhrase();
      showModalBottomSheet(
        scrollControlDisabledMaxHeightRatio: 1/1,
          context: context,
          builder: (context){
          return DecoratedSheet(
            hasCounter: false,
              title: "Enable Quick Login?",
              body: Container(
                padding: Paddings.smallAllSides,
                child: Column(
                  children: [
                    Text("Would you like to use biometrics for faster login next time?",
                    style: Blacks.mediumSemiRoboto,textAlign: TextAlign.center),
                    Spaces.mediumTopSpace,
                    Text("This means you will log in just by using your fingerprint, pattern, face or device pin number",
                    style: Grays.smallRoboto,textAlign: TextAlign.center),
                    Spaces.smallTopSpace,
                    Icon(HugeIcons.strokeRoundedFingerPrint,size: 64,color: HexColor(AppColors.primaryGreen)),
                    Spaces.mediumTopSpace,
                    AuthButton(
                        text: "Enable",
                        tapped: ()async{
                          bool authenticated = await _biometricService.authenticate(
                              localizedReason: "Confirm identity to enable biometric login");
                          Navigator.of(context).pop();
                          if (authenticated) {
                            await _secureStorage.write(key: 'biometric_phone', value: phone);
                            await _secureStorage.write(key: 'biometric_pass', value: pass);
                            await _secureStorage.write(key: 'biometric_enabled', value: 'true');
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(msg: "Biometric login enabled!");
                            _isBiometricsAvailable = true;
                            _loggedInPhoneForBiometrics = phone;
                            notifyListeners();
                          } else {
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(msg: "Biometric setup failed.");
                          }
                        }),
                    Spaces.smallTopSpace,
                    AuthButton(
                        color: AppColors.primaryOrange,
                        text: "Not Now",
                        tapped: (){
                          Navigator.pop(context);
                        })
                  ],
                ),
              ),
              height: 450);
          });
    }else{
      _isBiometricsAvailable = true;
      notifyListeners();
    }
  }

  Future<void> handleBiometricLogin(BuildContext context)async{
    if(_loggedInPhoneForBiometrics==null)return;

    bool authenticated = await _biometricService.authenticate(
        localizedReason: "Log in with your fingerprint or pin");

    if(authenticated){
      // ScaffoldMessenger.of(context).showSnackBar(
      //     SnackBar(content: Text("Welcome back, $_loggedInPhoneForBiometrics!")));
      String? phone=await _secureStorage.read(key: "biometric_phone");
      String? pass=await _secureStorage.read(key: 'biometric_pass');
      if(phone==null || pass==null){
        Fluttertoast.showToast(msg: "Please manually login.");
      }else{
        Provider.of<AuthProvider>(context,listen: false).setPhone(convertToLocalKenyanFormat(_loggedInPhoneForBiometrics!)!);
        await Provider.of<AuthProvider>(context,listen: false).login(phone, pass, context);
      }
    }else{
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Biometric authentication canceled.")));
    }
  }
  
}