import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/services/services.dart';
import '../widgets/widget.dart';

final getIt=GetIt.instance;
class AuthProvider extends ChangeNotifier {
  String? _email;
  String? get email => _email;

  String? _phone;
  String? get phone => _phone;

  bool _loading = false;
  bool get loading => _loading;

  String? _authError;
  String? get authError => _authError;

  String _accType = Strings.individualAcc;
  String get accType => _accType;

  String? _token;
  String? get token => _token;

  bool _otpSent = false;
  bool get otpSent => _otpSent;

  bool _resendingOTP = false;
  bool get resendingOTP => _resendingOTP;

  LocalUserModel? _localUser;
  LocalUserModel? get localUser => _localUser;

  bool _requestingReset=false;
  bool get requestingReset=>_requestingReset;

  String? _passResetRequest;
  String? get passResetRequest=>_passResetRequest;

  bool _settingPin = false;
  bool get settingPin => _settingPin;

  final emailController = TextEditingController();
  final usernameController = TextEditingController();

  LocalUserRepository localUserRepo = LocalUserService();

  AuthRepository apiAuth = AuthService();
  LocalAuthRepository localAuth = LocalAuthService();

  String normalizePhone(String phone) {
    final rawPhone = phone.trim();
    final normalizedPhone = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;
    final fullPhone = '254$normalizedPhone';
    return fullPhone;
  }

  void setAccType(String type) {
    _accType = type;
    notifyListeners();
  }

  Future<void> getAccessToken() async {
    _token = await localAuth.accessToken();
    debugPrint('==>AUTH PROVIDER ACCESS TOKEN IS $_token<===');
    notifyListeners();
  }

  void setEmail(String val) {
    _email = val;
    notifyListeners();
  }

  Future<void> setPhone(String val) async {
    // cache phone
    _phone = normalizePhone(val);
    notifyListeners();
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('phone', _phone!);
  }

  Future<void> getPhone() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    _phone = prefs.getString('phone');
    notifyListeners();
  }

  Future<void> register(String password, BuildContext context) async {
    _loading = true;
    notifyListeners();
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String userPhone = _phone ?? prefs.getString('phone')!;

    AuthResponse resp = await apiAuth.register(userPhone, password, _accType);
    if (resp.error != null) {
      _authError = resp.error;
      Fluttertoast.showToast(msg: _authError!);
      _authError = null;
    } else if (resp.message != null) {
      _otpSent = true;
      await prefs.setString('regPass', password);
      Fluttertoast.showToast(msg: resp.message!);
      await prefs.setString('page', Routes.verifyPhone);
      Navigator.pushNamed(context, Routes.verifyPhone);
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> verifyPhone(String otp, BuildContext context) async {
    _loading = true;
    _authError = null;
    notifyListeners();
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String userPhone = _phone ?? prefs.getString('phone')!;

    AuthResponse resp = await apiAuth.verifyPhone(userPhone, otp);
    if (resp.error != null) {
      _authError = resp.error;
      Fluttertoast.showToast(msg: _authError!);
      _loading = false;
    } else if (resp.message != null) {
      _otpSent = false;
      Fluttertoast.showToast(msg: "Phone number verified successfully!");
      await prefs.remove('page');

      String? regPass = prefs.getString('regPass');
      if (regPass != null) {
        // The login function will handle loading state and navigation.
        await login(userPhone, regPass, context);
        // Clean up the cached password for security.
        await prefs.remove('regPass');
      } else {
        _loading = false;
        Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
      }
    }
    notifyListeners();
  }

  void resetOtpSent() {
    _otpSent = false;
    notifyListeners();
  }

  Future<void> sendPhoneOTP() async {
    _resendingOTP = true;
    notifyListeners();
    String? localPhone = _localUser?.phoneNumber;
    AuthResponse resp = await apiAuth.sendPhoneOTP(_phone ?? localPhone!);
    if (resp.error != null) {
      _authError = resp.error;
      Fluttertoast.showToast(msg: _authError!);
      _authError = null;
    } else if (resp.message != null) {
      _otpSent = true;
      Fluttertoast.showToast(msg: resp.message!);
      notifyListeners();
    }
    _resendingOTP = false;
    notifyListeners();
  }

  Future<void> sendEmailOTP() async {
    _resendingOTP = true;
    notifyListeners();
    String? localEmail = _localUser?.email;
    AuthResponse resp = await apiAuth.sendEmailOTP(localEmail!);
    if (resp.error != null) {
      _authError = resp.error;
      Fluttertoast.showToast(msg: _authError!);
      _authError = null;
    } else if (resp.message != null) {
      if(!getIt.isRegistered<ProfileProvider>()){
        getIt.registerSingleton(ProfileProvider());
      }
      final profile=getIt<ProfileProvider>();
      profile.getUser();
      Fluttertoast.showToast(msg: resp.message!);
      notifyListeners();
    }
    _resendingOTP = false;
    notifyListeners();
  }

  Future<void> login(String phone, String password, BuildContext context) async {
    _loading = true;
    _phone = phone;
    notifyListeners();

    AuthResponse resp = await apiAuth.login(phone, password);
    if (resp.error != null) {
      if (resp.error == "Please verify your phone number before logging in.") {
        _otpSent = true;
        await sendPhoneOTP();
        Navigator.pushNamed(context, Routes.verifyPhone);
      } else {
        _authError = resp.error;
        Fluttertoast.showToast(msg: _authError!);
      }
    } else if (resp.accessToken != null) {
      _authError = null;
      await localAuth.saveAuth(password, resp.accessToken!, resp.refreshToken!);
      _token = await localAuth.accessToken();

      final user = await apiAuth.userInfo();

      _localUser = await localUserRepo.saveUser(user!);

      if (_localUser!.type == Strings.individualAcc && _localUser!.profileImg == null) {
        await Provider.of<KycIndividualProvider>(context, listen: false).getUserKycs(context);
        Navigator.pushNamed(context, Routes.kycIndividualSetup);
      } else if (_localUser!.type == Strings.businessAcc && _localUser!.profileImg == null) {
        await Provider.of<KycBusinessProvider>(context, listen: false).getUserKycs(context);
        Navigator.pushNamed(context, Routes.kycBusinessSetup);
      } else {
        Provider.of<ProfileProvider>(context, listen: false).setUser(_localUser!);
        Navigator.pushNamedAndRemoveUntil(context, Routes.home, (route) => false);
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> finishProfile(BuildContext context) async {
    _loading = true;
    if (emailController.text.trim().isEmpty) {
      Fluttertoast.showToast(msg: 'Enter your email');
      return false;
    }
    if (!Strings.emailRegEx.hasMatch(emailController.text.trim())) {
      Fluttertoast.showToast(msg: 'Ensure your email is well formatted');
      return false;
    } else {
      _loading = true;
      notifyListeners();

      Map<String,String> updates={};
      if(usernameController.text.isNotEmpty){
        updates.addAll({'username':usernameController.text.trim()});
      }else if(Strings.emailRegEx.hasMatch(emailController.text)){
        updates.addAll({"email":emailController.text.trim()});
      }
      final newUser = await apiAuth.updateProfile(_localUser!.userId!, updates);
      if (newUser == null) {

        Fluttertoast.showToast(msg: "Logging you out");
        await logout();
        Navigator.pushReplacementNamed(context, Routes.login);
        return false;
      } else if(newUser.error!=null){
        Fluttertoast.showToast(msg: newUser.error!);
        return false;
      } else {

        _localUser = await localUserRepo.updateUser(newUser);
        showGeneralDialog(
            context: context,
            pageBuilder: (context, anim1, anim2) {
              return const SizedBox();
            },
            transitionDuration: const Duration(milliseconds: 400),
            transitionBuilder: (context, anim1, anim2, child) {
              return SuccessAlert(
                  title: 'Profile Created!',
                  content: 'Welcome to the Tuku, enjoy seamless transacting and banking.',
                  tapped: () async {
                    await Provider.of<KycIndividualProvider>(context, listen: false).resetSteps();

                    Provider.of<ProfileProvider>(context, listen: false).setUser(_localUser!);
                    Navigator.pop(context);
                    Navigator.pushNamedAndRemoveUntil(context, Routes.home, (route) => false);
                  },
                  anim1: anim1);
            });
        return true;
      }
    }
  }

  Future<void> updateUser(BuildContext context) async {
    _loading = true;
    notifyListeners();
    final user = await apiAuth.userInfo();
    if (user == null) {

      await logout();
      Navigator.pushNamedAndRemoveUntil(
          context, Routes.login, (route) => false);
    } else {
      final updated = await localUserRepo.updateUser(user);
      _localUser = updated;
      notifyListeners();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    // clear payments
    if(getIt.isRegistered<PaymentsProvider>()){
      final paymentsProvider=getIt<PaymentsProvider>();
      paymentsProvider.clearLists();
    }else{
      getIt.registerSingleton(PaymentsProvider());
      final paymentsProvider=getIt<PaymentsProvider>();
      paymentsProvider.clearLists();
    }

    // clear fundraisers
    if(getIt.isRegistered<FundraiserProvider>()){
      final fundraiserProvider=getIt<FundraiserProvider>();
      fundraiserProvider.clearLists();
    }else{
      getIt.registerSingleton(FundraiserProvider());
      final fundraiserProvider=getIt<FundraiserProvider>();
      fundraiserProvider.clearLists();
    }

    await localUserRepo.clearDatabase();

    // clear profile
    if(getIt.isRegistered<ProfileProvider>()){
      final profileProvider=getIt<ProfileProvider>();
      profileProvider.clearUser();
    }else{
      getIt.registerSingleton(ProfileProvider());
      final profileProvider=getIt<ProfileProvider>();
      profileProvider.clearUser();
    }


    _localUser = null;
    notifyListeners();
  }

  Future<void> requestPasswordReset(String phoneNumber)async{
    _requestingReset=true;
    notifyListeners();
    _passResetRequest=await apiAuth.requestPasswordReset(phoneNumber);
    _requestingReset=false;
    notifyListeners();
  }

  Future<bool> setupPin(String pin, String confirmPin, BuildContext context) async {
    final req = PinRequest(pin: pin, confirmPin: confirmPin);
    final err = req.validationError();
    if (err != null) {
      Fluttertoast.showToast(msg: err);
      return false;
    }
    _settingPin = true;
    notifyListeners();
    try {
      String? msg = await apiAuth.setPin(req);
      if(msg!=null){
        Fluttertoast.showToast(msg: msg);
      }else{
        // refresh user info so requiresPinSetup flips
        final user = await apiAuth.userInfo();
        if (user != null) {
          _localUser = await localUserRepo.updateUser(user);
          Provider.of<ProfileProvider>(context, listen: false).setUser(_localUser!);
        }
        await showGeneralDialog(
            context: context,
            pageBuilder: (context,anim1,anim2)=>const SizedBox(),
        transitionDuration: const Duration(milliseconds: 400),
        transitionBuilder: (context,anim1,anim2,child){
              return SlideTransition(
                  position: Tween(
                    begin: const Offset(1, 0),
                    end: const Offset(0, 0)
                  ).animate(anim1),
              child: SuccessAlert(
                  title: 'Pin created!',
                  content: 'Your pin was set successfully!',
                  tapped: (){
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  anim1: anim1)
              );
        });
      }
      _settingPin = false;
      notifyListeners();
      return true;
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString());
      _settingPin = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPin(String pin, String confirmPin) async {
    final req = PinRequest(pin: pin, confirmPin: confirmPin);
    final err = req.validationError();
    if (err != null) {
      Fluttertoast.showToast(msg: err);
      return false;
    }
    _settingPin = true;
    notifyListeners();
    try {
      String? msg = await apiAuth.resetPin(req);
      if(msg!=null){
        Fluttertoast.showToast(msg: msg);
      }
      _settingPin = false;
      notifyListeners();
      return true;
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString());
      _settingPin = false;
      notifyListeners();
      return false;
    }
  }
}
