import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
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
import 'package:tuku/utils/image_compressor.dart';
import 'package:tuku/utils/utils.dart';
import 'package:tuku/widgets/widget.dart';

import '../endpoints/endpoints.dart';

class KycBusinessProvider extends ChangeNotifier{
  int _currentStep=0;
  int get currentStep=>_currentStep;


  // response from api
  KycModel? _businessCertKyc;

  KycModel? _kraPinKyc;

  KycModel? _logoKyc;

  bool _loadingKycs=false;
  bool get loadingKycs=>_loadingKycs;

  List<LocalKycModel> _userKycs=[];
  List<LocalKycModel> get userKycs=>_userKycs;

  bool _submittingBusinessCert=false;
  bool get submittingBusinessCert=>_submittingBusinessCert;

  bool _submittingKraPin=false;
  bool get submittingKraPin=>_submittingKraPin;

  bool _submittingLogo=false;
  bool get submittingLogo=>_submittingLogo;

  bool _deletingKyc=false;
  bool get deletingKyc=>_deletingKyc;

  bool _finishing=false;
  bool get finishing=>_finishing;

  String? _kycDeleteResp;
  String? get kycDeleteResp=>_kycDeleteResp;


  File? _businessCert;
  File? get businessCert=>_businessCert;

  File? _kraCert;
  File? get kraCert=>_kraCert;

  File? _pickedLogo;
  File? get pickedLogo=>_pickedLogo;


  KycRepository api=KycService();
  LocalKycRepository local=LocalKycService();

  LocalUserService localUserService=LocalUserService();

  final sizeChecker=FileSizeChecker();

  final _isolateRunner=LimitedIsolateRunner(maxConcurrent: 3);

  // SKIP TO CURRENT STEP IF HAS EXITED APP
  Future<void> getCurrentStep()async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    _currentStep=prefs.getInt('step')??0;
    notifyListeners();
  }

  Future<void> nextStep()async{
    if(currentStep<2){ // only 0,1,2
      _currentStep++;
      notifyListeners();
      SharedPreferences prefs=await SharedPreferences.getInstance();
      await prefs.setInt('step', _currentStep);
    }
  }

  Future<void> resetSteps()async{
    _currentStep=0;
    notifyListeners();
    SharedPreferences prefs=await SharedPreferences.getInstance();
    prefs.remove('step');
  }

  Future<bool> handleStepSubmission(BuildContext context)async{
    switch(_currentStep){
      case 0:
        return proceedToLogo();
      case 1:
        return proceedToFinish();
      case 2:
        return finishProfile(context);
      default:
        return false;
    }
  }

  // PICK BUSINESS CERT
  Future<bool> pickBusinessCert()async{
    FilePickerResult? result=await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf'],
      type: FileType.custom,
    );
    if(result!=null && sizeChecker.isLarge(File(result.files.single.path!))){
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    }else if (result!=null){
      _businessCert=File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  //  SUBMIT BUSINESS CERT
  Future<void> submitBusinessCert(BuildContext context)async{
    _submittingBusinessCert=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    _businessCertKyc=await _isolateRunner.runUploadTask(
        docType: Strings.businessCert, filePath: _businessCert!.path,
        fileType: Strings.pdfType, fileExt: Strings.pdfExt,
        url: Kyc().uploadDoc, isolateToken: isolateToken);
    if(_businessCertKyc?.error!=null){
      // token has expired thus force logout
      Fluttertoast.showToast(msg: _businessCertKyc!.error!);
      await Provider.of<AuthProvider>(context,listen: false).logout();
      Navigator.pushReplacementNamed(
          context, Routes.login);
    }else{
      // SAVE kycObj locally
      final localKyc=await local.saveCertKyc(_businessCertKyc!);
      _userKycs.add(localKyc);
      _businessCert=null;
      if(_businessCertKyc?.certAnalysis!=null && _businessCertKyc?.certAnalysis?.certNumber!=null){
        // IF businessCert kycObj HAS ANALYSIS, APPLY TO PROFILE
        await api.applyAnalysis(_businessCertKyc!.document!.id);
      }
    }
    _submittingBusinessCert=false;
    notifyListeners();
  }

  // PICK KRA CERT
  Future<bool> pickKraCert()async{
    FilePickerResult? result=await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf'],
      type: FileType.custom
    );
    if(result!=null && sizeChecker.isLarge(File(result.files.single.path!))){
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    }else if(result!=null){
      _kraCert=File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  // SUBMIT KRA CERT
  Future<void> submitKraCert(BuildContext context)async{
    _submittingKraPin=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    _kraPinKyc=await _isolateRunner.runUploadTask(
        docType: Strings.kraPinCert, filePath: _kraCert!.path,
        fileType: Strings.pdfType, fileExt: Strings.pdfExt,
        url: Kyc().uploadDoc, isolateToken: isolateToken);
    if(_kraPinKyc?.error!=null){
      // token has expired thus force logout
      Fluttertoast.showToast(msg: _kraPinKyc!.error!);
      await Provider.of<AuthProvider>(context,listen: false).logout();
      Navigator.pushReplacementNamed(
          context, Routes.login);
    }else{
      // SAVE kycObj locally
      final localKyc=await local.saveKraKyc(_kraPinKyc!);
      _userKycs.add(localKyc);
      _kraCert=null;
      if(_kraPinKyc?.kraAnalysis!=null){
        // IF kraCert kycObj HAS ANALYSIS, APPLY TO PROFILE
        await api.applyAnalysis(_kraPinKyc!.document!.id);
      }
    }
    _submittingKraPin=false;
    notifyListeners();
  }
  
  Future<bool> proceedToLogo()async{
    // CHECK IF BIZ CERT HAS BEEN UPLOADED
    bool hasBizCert=_userKycs.where((el)=>el.docType==Strings.businessCert).isNotEmpty;
    // CHECK IF BIZ CERT HAS BEEN ANALYZED
    bool bizCertAnalyzed=_userKycs.where((el)=>el.certNumber!=null).isNotEmpty;
    // CHECK IF KRA PIN CERT HAS BEEN UPLOADED
    bool hasKraCert=_userKycs.where((el)=>el.docType==Strings.kraPinCert).isNotEmpty;
    // CHECK IF KRA PIN CERT HAS BEEN ANALYZED
    bool kraCertAnalyzed=_userKycs.where((el)=>el.kraPin!=null).isNotEmpty;
    bool success=(bizCertAnalyzed&&kraCertAnalyzed);
    if(success){
      return true;
    }else{
      if(!hasBizCert){
        Fluttertoast.showToast(msg: 'Upload your business certificate');
      }else if(!bizCertAnalyzed){
        Fluttertoast.showToast(msg: 'Re-upload your business certificate');
      }else if(!hasKraCert){
        Fluttertoast.showToast(msg: 'Upload your KRA certificate');
      }else if(!kraCertAnalyzed){
        Fluttertoast.showToast(msg: 'Re-upload your KRA certificate');
      }
      return false;
    }
  }

  // PICK A LOGO
  Future<void> pickLogo()async{
    FilePickerResult? result=await FilePicker.platform.pickFiles(
      allowedExtensions: ['jpg', 'png', 'jpeg'],
      type: FileType.custom
    );
    if(result!=null){
      _pickedLogo=File(result.files.single.path!);
      notifyListeners();
    }
  }

  // SUBMIT LOGO
  Future<void> submitLogo(BuildContext context)async{
    _submittingLogo=true;
    notifyListeners();
    RootIsolateToken isolateToken=RootIsolateToken.instance!;
    _logoKyc=await api.uploadDocument(
        docType: Strings.selfie,
        selectedFile: _pickedLogo!,
        fileType: Strings.imageType,
        fileExt: Strings.imageExt,
      url: Kyc().uploadDoc);
    _logoKyc=await _isolateRunner.runUploadTask(
        docType: Strings.selfie, filePath: _pickedLogo!.path,
        fileType: Strings.imageType, fileExt: Strings.imageExt,
        url: Kyc().uploadDoc, isolateToken: isolateToken);
    if(_logoKyc?.error!=null){
      // token has expired thus force logout
      Fluttertoast.showToast(msg: _logoKyc!.error!);
      await Provider.of<AuthProvider>(context,listen: false).logout();
      Navigator.pushReplacementNamed(
          context, Routes.login);
    }else{
      // SAVE kycObj locally
      final localKyc=await local.saveSelfieKyc(_logoKyc!);
      _userKycs.add(localKyc);
      _pickedLogo=null;
      await api.applyAnalysis(_logoKyc!.document!.id);
    }
    _submittingLogo=false;
    notifyListeners();
  }

  Future<bool> proceedToFinish()async{
    // CHECK IF LOGO HAS BEEN UPLOADED
    bool logoExists=_userKycs.where((el)=>el.docType==Strings.selfie).isNotEmpty;
    if(logoExists){
      return true;
    }else{
      Fluttertoast.showToast(msg: 'Upload your business logo');
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
      final kycs=await api.listDocuments();
      if(kycs!=null){
        if(kycs.isNotEmpty){ // if kycs exist in api
          final savedKycs=await local.saveKycs(kycs);
          _userKycs.addAll(savedKycs);
        }
      }else{ // if null kyc resp , expired token
        await Provider.of<AuthProvider>(context,listen: false).logout();
        Fluttertoast.showToast(msg: 'Logging You out..');
        Navigator.pushReplacementNamed(context, Routes.login);
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
      _deletingKyc=false;
      notifyListeners();
      return false;
    }
  }
}

final List<Widget> BusinessKycSteps=[
  BusinessCerts(),
  Logo(),
  Email()
];