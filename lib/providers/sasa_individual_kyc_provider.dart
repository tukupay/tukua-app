import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/widgets/widget.dart';

class SasaIndividualKycProvider extends ChangeNotifier{

  int _currentStep=0;
  int get currentStep=>_currentStep;

  // SKIP TO CURRENT STEP IF HAD EXITED APP
  Future<void> getCurrentStep()async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    _currentStep=prefs.getInt('sasa_step')??0;
    notifyListeners();
  }

  Future<void> nextStep()async{
    if(_currentStep<2){
      _currentStep++;
      SharedPreferences prefs=await SharedPreferences.getInstance();
      await prefs.setInt('sasa_step', _currentStep);
      notifyListeners();
    }
  }

  Future<void> previousStep()async{
    if(_currentStep>0){
      _currentStep--;
      SharedPreferences prefs=await SharedPreferences.getInstance();
      await prefs.setInt('sasa_step', _currentStep);
      notifyListeners();
    }
  }

  Future<void> resetSteps()async{
    _currentStep=0;
    SharedPreferences prefs=await SharedPreferences.getInstance();
    await prefs.remove('sasa_step');
    notifyListeners();
  }

  Future<bool> handleStepSubmission(BuildContext context)async{
    Fluttertoast.cancel();
    switch(_currentStep){
      case 0:
        return proceedToOtp();
      case 1:
        return proceedToActivate();
      case 2:
        return finishOnboarding(context);
      default:
        return false;
    }
  }

  Future<bool> proceedToOtp()async{
    Fluttertoast.showToast(msg: "/.../sasapay/onboard/customer/initial");
    await nextStep();
    return true;
  }

  Future<bool> proceedToActivate()async{
    Fluttertoast.showToast(msg: "/.../sasapay/onboard/customer/confirm");
    await nextStep();
    return true;
  }

  Future<bool> finishOnboarding(BuildContext context)async{
    Fluttertoast.showToast(msg: "to send kyc docs to sasa");
    await resetSteps();
    Navigator.pop(context);
    return true;
  }

  final List<Widget> sasaIndividualSteps=[
    ConfirmIndividualDetails(),
    SasaOnboardingOtp(),
    IndividualWalletActivation()
  ];
}