import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import 'package:tuku/utils/utils.dart';
import 'package:tuku/widgets/widget.dart';

class SasaBusinessKycProvider extends ChangeNotifier{
  int _currentStep=0;
  int get currentStep=>_currentStep;

  // ── Existing KYC details (read-only, from tuku onboarding) ──
  String get businessName => 'Tuku Enterprises Ltd';
  String get registrationNumber => 'PVT-2024-001234';
  String get kraPin => 'A012345678Z';
  String get email => 'info@tukuenterprises.co.ke';
  String get mobileNumber => '0712345678';

  // ── NEW Business Fields ──

  // Dropdown selections
  String? _businessType;
  String get businessType => _businessType ?? '';
  void selectBusinessType(String val){ _businessType = val; notifyListeners(); }

  String? _businessCategory;
  String get businessCategory => _businessCategory ?? '';
  void selectBusinessCategory(String val){ _businessCategory = val; notifyListeners(); }

  String? _businessSubcategory;
  String get businessSubcategory => _businessSubcategory ?? '';
  void selectBusinessSubcategory(String val){ _businessSubcategory = val; notifyListeners(); }

  String? _productType;
  String get productType => _productType ?? '';
  void selectProductType(String val){ _productType = val; notifyListeners(); }

  String? _countryId;
  String get countryId => _countryId ?? '';
  void selectCountry(String val){ _countryId = val; notifyListeners(); }

  String? _subregionId;
  String get subregionId => _subregionId ?? '';
  void selectSubregion(String val){ _subregionId = val; notifyListeners(); }

  String? _industryId;
  String get industryId => _industryId ?? '';
  void selectIndustry(String val){ _industryId = val; notifyListeners(); }

  String? _subIndustryId;
  String get subIndustryId => _subIndustryId ?? '';
  void selectSubIndustry(String val){ _subIndustryId = val; notifyListeners(); }

  String? _bankCode;
  String get bankCode => _bankCode ?? '';
  void selectBankCode(String val){ _bankCode = val; notifyListeners(); }

  String? _purpose;
  String get purpose => _purpose ?? '';
  void selectPurpose(String val){ _purpose = val; notifyListeners(); }


  // ── Business Documents (NEW – not in tuku onboarding) ──
  final FileSizeChecker _sizeChecker = FileSizeChecker();

  File? _cr12Doc;
  File? get cr12Doc => _cr12Doc;

  File? _proofOfAddressDoc;
  File? get proofOfAddressDoc => _proofOfAddressDoc;

  File? _proofOfBankDoc;
  File? get proofOfBankDoc => _proofOfBankDoc;

  bool _submittingDocs = false;
  bool get submittingDocs => _submittingDocs;

  // ── Directors (Dynamic List) ──
  List<Director> _directors = [];
  List<Director> get directors => _directors;

  SasaPayRepository api=SasaPayService();


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
    Fluttertoast.showToast(msg: "/.../sasapay/onboard/business/initial");
    await nextStep();
    return true;
  }

  Future<bool> proceedToActivate()async{
    Fluttertoast.showToast(msg: "/.../sasapay/onboard/business/confirm");
    await nextStep();
    return true;
  }

  Future<bool> finishOnboarding(BuildContext context)async{
    Fluttertoast.showToast(msg: "Congratulations! Your SasaPay Business Wallet is now active.");
    await resetSteps();
    Navigator.pop(context);
    return true;
  }

  void addDirector(){
    _directors.add(Director());
    notifyListeners();
  }

  void removeDirector(int index){
    if(index >= 0 && index < _directors.length){
      _directors[index].dispose();
      _directors.removeAt(index);
      notifyListeners();
    }
  }

  // ── Pick business-level documents ──

  Future<bool> pickCr12() async {
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _cr12Doc = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeCr12() {
    _cr12Doc = null;
    notifyListeners();
  }

  Future<bool> pickProofOfAddress() async {
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _proofOfAddressDoc = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeProofOfAddress() {
    _proofOfAddressDoc = null;
    notifyListeners();
  }

  Future<bool> pickProofOfBank() async {
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _proofOfBankDoc = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeProofOfBank() {
    _proofOfBankDoc = null;
    notifyListeners();
  }

  // ── Pick director-level documents ──

  Future<bool> pickDirectorFrontId(int index) async {
    if (index < 0 || index >= _directors.length) return false;
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _directors[index].frontIdFile = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeDirectorFrontId(int index) {
    if (index >= 0 && index < _directors.length) {
      _directors[index].frontIdFile = null;
      notifyListeners();
    }
  }

  Future<bool> pickDirectorBackId(int index) async {
    if (index < 0 || index >= _directors.length) return false;
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _directors[index].backIdFile = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeDirectorBackId(int index) {
    if (index >= 0 && index < _directors.length) {
      _directors[index].backIdFile = null;
      notifyListeners();
    }
  }

  Future<bool> pickDirectorKraPin(int index) async {
    if (index < 0 || index >= _directors.length) return false;
    final result = await FilePicker.platform.pickFiles(
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      type: FileType.custom,
    );
    if (result != null && _sizeChecker.isLarge(File(result.files.single.path!))) {
      Fluttertoast.showToast(msg: 'Max limit is 2 MB');
      return false;
    } else if (result != null) {
      _directors[index].kraPinFile = File(result.files.single.path!);
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeDirectorKraPin(int index) {
    if (index >= 0 && index < _directors.length) {
      _directors[index].kraPinFile = null;
      notifyListeners();
    }
  }

  // ── Validation ──

  bool get allBusinessDocsProvided =>
      _cr12Doc != null && _proofOfAddressDoc != null && _proofOfBankDoc != null;

  bool directorDocsComplete(int index) {
    if (index < 0 || index >= _directors.length) return false;
    final d = _directors[index];
    return d.frontIdFile != null && d.backIdFile != null && d.kraPinFile != null;
  }

  bool get allDirectorDocsComplete {
    if (_directors.isEmpty) return false;
    return _directors.every((d) =>
        d.frontIdFile != null && d.backIdFile != null && d.kraPinFile != null);
  }

  bool get allDocsReady => allBusinessDocsProvided && allDirectorDocsComplete;

  // ── Dummy data lists ──
  static const businessTypes = ['Sole Proprietorship', 'Partnership', 'Limited Company', 'NGO', 'Society', 'Trust'];
  static const businessCategories = ['Retail', 'Wholesale', 'Service', 'Manufacturing', 'Agriculture', 'Technology', 'Healthcare', 'Education', 'Hospitality', 'Transport'];
  static const businessSubcategories = ['General', 'Food & Beverage', 'Electronics', 'Clothing & Apparel', 'Financial Services', 'Real Estate', 'Consultancy', 'Logistics'];
  static const productTypes = ['Goods', 'Services', 'Digital Products', 'Subscriptions', 'Mixed'];
  static const countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia'];
  static const subregions = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos'];
  static const industries = ['Finance & Banking', 'Retail & Commerce', 'Technology', 'Agriculture', 'Healthcare', 'Education', 'Construction', 'Transport & Logistics'];
  static const subIndustries = ['Mobile Money', 'Micro-lending', 'Insurance', 'Savings & Credit', 'E-commerce', 'POS Systems', 'Supply Chain', 'EdTech'];
  static const bankCodes = ['KCB Bank', 'Equity Bank', 'Co-operative Bank', 'NCBA Bank', 'Absa Bank', 'Stanbic Bank', 'Standard Chartered', 'I&M Bank', 'DTB Bank', 'Family Bank'];
  static const purposes = ['Collection', 'Disbursement', 'Remittance'];

  final List<Widget> sasaBusinessSteps=[
    BusinessRegistration(),
    SasaOnboardingOtp(),
    BusinessDocuments()
   ];
}

/// Represents a single director entry
class Director {
  final nameController = TextEditingController();
  final idNumberController = TextEditingController();
  final phoneController = TextEditingController();

  // Director document files
  File? frontIdFile;
  File? backIdFile;
  File? kraPinFile;

  void dispose(){
    nameController.dispose();
    idNumberController.dispose();
    phoneController.dispose();
  }
}