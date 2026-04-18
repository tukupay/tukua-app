import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/isolate/isolate.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/services/services.dart';
import 'package:tuku/widgets/widget.dart';

import '../endpoints/endpoints.dart';

class TukuIndividualKycProvider extends ChangeNotifier{

  int _currentStep=0;
  int get currentStep=>_currentStep;

  bool _isSelfie=false;
  bool get isSelfie=>_isSelfie;

  // response from api
  KycModel? _frontIdKyc;

  KycModel? _backIdKyc;

  KycModel? _selfieKyc;

  bool _loadingKycs=false;
  bool get loadingKycs=>_loadingKycs;

  List<LocalKycModel> _userKycs=[];
  List<LocalKycModel> get userKycs=>_userKycs;

  bool _isFrontId=true;
  bool get isFrontId=>_isFrontId;

  bool _submittingFrontId=false;
  bool get submittingFrontId=>_submittingFrontId;

  bool _submittingBackId=false;
  bool get submittingBackId=>_submittingBackId;

  bool _submittingSelfie=false;
  bool get submittingSelfie=>_submittingSelfie;

  bool _deletingKyc=false;
  bool get deletingKyc=>_deletingKyc;

  bool _finishing=false;
  bool get finishing=>_finishing;

  String? _kycDeleteResp;
  String? get kycDeleteResp=>_kycDeleteResp;

  KycRepository api=KycService();
  LocalKycRepository local=LocalKycService();

  LocalUserService localUserService=LocalUserService();

  final _isolateRunner=LimitedIsolateRunner(maxConcurrent: 3);

  // SKIP TO CURRENT STEP IF HAD EXITED APP
  Future<void> getCurrentStep()async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    _currentStep=prefs.getInt('tuku_step')??0;
    notifyListeners();
  }

  Future<void> nextStep()async{
    if(_currentStep<2){ // only 0,1,2
      _currentStep++;
      notifyListeners();
      SharedPreferences prefs=await SharedPreferences.getInstance();
      await prefs.setInt('tuku_step', _currentStep);
    }
  }

  Future<void> resetSteps()async{
    _currentStep=0;
    notifyListeners();
    SharedPreferences prefs=await SharedPreferences.getInstance();
    await prefs.remove('tuku_step');
  }

  void resetIsFrontId(){
    _isFrontId=false;
    notifyListeners();
  }

  void setIsFrontId(){
    _isFrontId=true;
    notifyListeners();
  }

  void setIsSelfie(){
    _isSelfie=true;
    notifyListeners();
  }

  void resetIsSelfie(){
    _isSelfie=false;
    notifyListeners();
  }

  Future<bool> handleStepSubmission(BuildContext context)async{
    switch(_currentStep){
      case 0:
        return proceedToSelfie();
      case 1:
        return proceedToFinish();
      case 2:
        return finishProfile(context);
      default:
        return false;
    }
  }

  // SUBMIT FRONT SIDE OF ID
  Future<bool> submitFrontId(CameraProvider camera,AuthProvider auth)async{
    _submittingFrontId=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    // SELECT THE ID CAPTURED FROM CAMERA
    final frontId=camera.capturedId!;
    // SEND FRONT ID FOR ANALYSIS, RETRIEVE kycObj
    _frontIdKyc=await _isolateRunner.runUploadTask(
        docType: Strings.frontId, filePath: frontId.path,
        fileType: Strings.imageType, fileExt: Strings.imageExt,
        url: Kyc().uploadDoc,isolateToken: isolateToken);
    if(_frontIdKyc?.error!=null){
      // if kyc resp is an error, force logout
      Fluttertoast.showToast(msg: _frontIdKyc!.error!);
      _submittingFrontId=false;
      notifyListeners();
      return false;
    }else{
      // SAVE kycObj LOCALLY
      final localKyc=await local.saveFrontKyc(_frontIdKyc!);
      _userKycs.add(localKyc);
      // RESET THE  CAPTURED ID VAR.
      camera.resetCapturedId();
      if(_frontIdKyc?.frontAnalysis!=null){
        // IF frontId kycObj HAS ANALYSIS, APPLY TO PROFILE
        String? error=await api.applyAnalysis(_frontIdKyc!.document!.id);
        if(error!=null){
          Fluttertoast.showToast(msg: error);
        }
      }
    }
    _submittingFrontId=false;
    notifyListeners();
    return true;
  }



  // SUBMIT BACK SIDE OF ID
  Future<bool> submitBackId(CameraProvider camera,AuthProvider auth)async{
    _submittingBackId=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    // SELECT THE ID CAPTURED FROM CAMERA
    final backId=camera.capturedId!;
    // SEND BACK ID FOR ANALYSIS, RETRIEVE kycObj
    _backIdKyc=await _isolateRunner.runUploadTask(
        docType: Strings.backId, filePath: backId.path,
        fileType: Strings.imageType, fileExt: Strings.imageExt,
        url: Kyc().uploadDoc,isolateToken: isolateToken);
    if(_backIdKyc?.error!=null){
      // if kyc resp is an error, force logout
      Fluttertoast.showToast(msg: _backIdKyc!.error!);
      await auth.logout();
      return false;
    }else{
      // SAVE kycObj LOCALLY
      final localKyc=await local.saveBackKyc(_backIdKyc!);
      _userKycs.add(localKyc);
      // RESET THE  CAPTURED ID VAR.
      camera.resetCapturedId();
      if(_backIdKyc?.backAnalysis!=null){
        // IF backId kycObj HAS ANALYSIS, APPLY TO PROFILE
        await api.applyAnalysis(_backIdKyc!.document!.id);
      }
    }
    _submittingBackId=false;
    notifyListeners();
    return true;
  }

  Future<bool> proceedToSelfie()async{
    // CHECK IF FRONT ID HAS BEEN CAPTURED
    bool frontExists=_userKycs.where(
            (el)=>el.docType==Strings.frontId).isNotEmpty;
    // CHECK IF FRONT HAS BEEN SCANNED
    bool frontScanned=_userKycs.where(
            (el)=>el.firstName!=null).isNotEmpty;
    // CHECK IF BACK HAS BEEN CAPTURED
    bool backExists=_userKycs.where(
            (el)=>el.docType==Strings.backId).isNotEmpty;
    // CHECK IF BACK HAS BEEN SCANNED
    bool backScanned=_userKycs.where(
            (el)=>el.division!=null).isNotEmpty;
    bool success=(frontScanned);
    if(success){
      return true;
    }else{
      if(!frontExists){
        Fluttertoast.showToast(msg: 'Capture the front of your id');
      }else if(!frontScanned){
        Fluttertoast.showToast(msg: 'Recapture the front of your id');
      }
      else if(!backExists){
        Fluttertoast.showToast(msg: 'Capture the back of your id');
      }
      else if(!backScanned){
        Fluttertoast.showToast(msg: 'Recapture the back of your id');
      }
      return false;
    }
  }
  
  // SUBMIT SELFIE
  Future<bool> submitSelfie(CameraProvider camera,AuthProvider auth)async{
    _submittingSelfie=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    // SELECT THE SELFIE CAPTURED FROM CAMERA
    final selfie=camera.capturedSelfie!;
    // UPLOAD SELFIE AND RETRIEVE kycObj
    _selfieKyc=await _isolateRunner.runUploadTask(
        docType: Strings.selfie, filePath: selfie.path,
        fileType: Strings.imageType, fileExt: Strings.imageExt,
        url: Kyc().uploadDoc,isolateToken: isolateToken);
    if(_selfieKyc?.error!=null){
      // if kyc resp is an error, force logout
      Fluttertoast.showToast(msg: _selfieKyc!.error!);
      await auth.logout();
      return false;
    }else{
      // SAVE kycObj LOCALLY
      final localKyc=await local.saveSelfieKyc(_selfieKyc!);
      _userKycs.add(localKyc);
      if(_selfieKyc?.selfieAnalysis!=null){
        // IF selfie kycObj HAS ANALYSIS, APPLY TO PROFILE
        await api.applyAnalysis(_selfieKyc!.document!.id);
      }
    }
    _submittingSelfie=false;
    notifyListeners();
    return true;
  }

  Future<bool> proceedToFinish()async{
    // CHECK IF SELFIE HAS BEEN CAPTURED
    bool selfieExists=_userKycs.where(
            (el)=>el.docType==Strings.selfie).isNotEmpty;
    // CHECK IS SELFIE HAS BEEN SCANNED
    bool selfieScanned=_userKycs.where((el)=>el.isFace!=null).isNotEmpty;
    if(selfieScanned){
      return true;
    }else{
      if(!selfieExists){
        Fluttertoast.showToast(msg: 'Capture a selfie of you');
      }else if(!selfieScanned){
        Fluttertoast.showToast(msg: 'Recapture your selfie');
      }
      return false;
    }
  }

  // SET EMAIL & OPTIONAL UPDATE USERNAME
  Future<bool> finishProfile(BuildContext context)async{
    _finishing=true;
    notifyListeners();
    final res= await Provider.of<AuthProvider>(context,listen: false).finishProfile(context);
    _finishing=false;
    notifyListeners();
    return res;
  }

  Future<void> getUserKycs(BuildContext context)async{
    _loadingKycs=true;
    notifyListeners();
    _userKycs=await local.getKycs(); // query local kycs
    if(_userKycs.isEmpty){
      final kycs=await api.listDocuments(); // call api if empty
      if(kycs!=null){
        if(kycs.isNotEmpty){ // if kycs exist in api
          final savedKycs=await local.saveKycs(kycs);
          _userKycs.addAll(savedKycs);
        }
      }else{ // if kyc resp is null (expired token)
        await Provider.of<AuthProvider>(context,listen: false).logout();
        Fluttertoast.showToast(msg: 'Logging You out...');
        Navigator.pushReplacementNamed(
            context, Routes.login);
      }
    }
    _loadingKycs=false;
    notifyListeners();
  }

  Future<bool> deleteKyc(int id,BuildContext context)async{
    _deletingKyc=true;
    notifyListeners();
    _kycDeleteResp=await api.deleteDocument(id);
    if(_kycDeleteResp==null){
      await local.deleteKyc(id);
      _userKycs.removeWhere((el)=>el.kycId==id);
      _deletingKyc=false;
      notifyListeners();
      return true;
    }else{
      Fluttertoast.showToast(msg: _kycDeleteResp!);
    }
    _deletingKyc=false;
    notifyListeners();
    return false;
  }
}

final List<Widget> IndividualKycSteps = [
  const CaptureIds(),
  const Selfie(),
  const Email(),
];
