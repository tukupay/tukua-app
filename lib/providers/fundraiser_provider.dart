import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class FundraiserProvider extends ChangeNotifier {
  File? _coverImage;
  File? get coverImage => _coverImage;

  File? _otherOne;
  File? get otherOne => _otherOne;

  File? _otherTwo;
  File? get otherTwo => _otherTwo;

  File? _otherThree;
  File? get otherThree => _otherThree;

  WalletSnippet? _selectedWallet;
  WalletSnippet? get selectedWallet => _selectedWallet;

  // Full wallet for universal selector (preferred)
  FullWallet? _selectedWalletFull;
  FullWallet? get selectedWalletFull => _selectedWalletFull;

  // categories
  bool _loadingCategories = false;
  bool get loadingCategories => _loadingCategories;

  List<String> _categories = [];
  List<String> get categories => _categories;

  bool _loadingStatuses = false;
  bool get loadingStatuses => _loadingStatuses;

  List<String> _statuses = [];
  List<String> get statuses => _statuses;

  String? _selectedCategory;
  String? get selectedCategory => _selectedCategory;

  List<File> _otherImages = [];
  List<File> get otherImages => _otherImages;

  DateTime? _startDate;
  DateTime? get startDate => _startDate;

  DateTime? _endDate;
  DateTime? get endDate => _endDate;

  // available wallets for fundraiser
  List<WalletSnippet> _availableWallets = [];
  List<WalletSnippet> get availableWallets => _availableWallets;

  // adding fundraiser
  bool _publiclyVisible = false;
  bool get publiclyVisible => _publiclyVisible;

  bool _allowPledging = false;
  bool get allowPledging => _allowPledging;

  bool _publicAnalytics = false;
  bool get publicAnalytics => _publicAnalytics;

  bool _postingFundraiser = false;
  bool get postingFundraiser => _postingFundraiser;

  FundraiserResponse? _createResponse;
  FundraiserResponse? get createResponse => _createResponse;

  FundraiserResponse? _selectedFundraiser;
  FundraiserResponse? get selectedFundraiser => _selectedFundraiser;

  bool _loadingFundraiser = false;
  bool get loadingFundraiser => _loadingFundraiser;

  bool _loadingActiveFundraisers = false;
  bool get loadingActiveFundraisers => _loadingActiveFundraisers;

  bool _loadingInactiveFundraisers = false;
  bool get loadingInactiveFundraisers => _loadingInactiveFundraisers;

  bool _loadingCancelledFundraisers = false;
  bool get loadingCancelledFundraisers => _loadingCancelledFundraisers;

  bool _loadingCompletedFundraisers = false;
  bool get loadingCompletedFundraisers => _loadingCompletedFundraisers;


  bool _loadingAllFundraisers = false;
  bool get loadingAllFundraisers => _loadingAllFundraisers;

  // active, inactive, cancelled, completed
  List<FundraiserResponse> _activeFundraisers = [];
  List<FundraiserResponse> get activeFundraisers => _activeFundraisers;

  List<FundraiserResponse> _inactiveFundraisers = [];
  List<FundraiserResponse> get inactiveFundraisers => _inactiveFundraisers;

  List<FundraiserResponse> _cancelledFundraisers = [];
  List<FundraiserResponse> get cancelledFundraisers => _cancelledFundraisers;

  List<FundraiserResponse> _completedFundraisers = [];
  List<FundraiserResponse> get completedFundraisers => _completedFundraisers;

  List<FundraiserResponse> _allFundraisers = [];
  List<FundraiserResponse> get allFundraisers => _allFundraisers;

  bool _deletingFundraiser = false;
  bool get deletingFundraiser => _deletingFundraiser;

  String? _deleteResponse;
  String? get deleteResponse => _deleteResponse;

  // updating fundraiser
  bool _updatingFundraiser = false;
  bool get updatingFundraiser => _updatingFundraiser;

  FundraiserResponse? _updateResponse;
  FundraiserResponse? get updateResponse => _updateResponse;

  // pledges
  bool _loadingPledges = false;
  bool get loadingPledges => _loadingPledges;

  List<PledgeResponse> _campaignPledges = [];
  List<PledgeResponse> get campaignPledges => _campaignPledges;

  bool _pledging = false;
  bool get getPledging => _pledging;

  PledgeResponse? _pledgeResponse;
  PledgeResponse? get pledgeResponse => _pledgeResponse;

  bool _loadingMyPledges = false;
  bool get loadingMyPledges => _loadingMyPledges;

  List<PledgeResponse> _myPledges = [];
  List<PledgeResponse> get myPledges => _myPledges;

  PledgeResponse? _selectedPledge;
  PledgeResponse? get selectedPledge => _selectedPledge;

  bool _updatingPledge = false;
  bool get updatingPledge => _updatingPledge;

  PaymentMethod? _selectedPledgeMethod;
  PaymentMethod? get selectedPledgeMethod => _selectedPledgeMethod;

  FullWallet? _pledgeWallet;
  FullWallet? get pledgeWallet => _pledgeWallet;

  FullBank? _pledgeBank;
  FullBank? get pledgeBank => _pledgeBank;

  bool _processingPledge = false;
  bool get processingPledge => _processingPledge;

  PledgePaymentResponse? _pledgePaymentResponse;
  PledgePaymentResponse? get pledgePaymentResponse => _pledgePaymentResponse;

  // contributions
  PaymentMethod? _selectedContributionMethod;
  PaymentMethod? get selectedContributionMethod => _selectedContributionMethod;

  FullWallet? _contributionWallet;
  FullWallet? get contributionWallet => _contributionWallet;

  FullBank? _contributionBank;
  FullBank? get contributionBank => _contributionBank;

  bool _contributing = false;
  bool get contributing => _contributing;

  ContributionResponse? _contributionResponse;
  ContributionResponse? get contributionResponse => _contributionResponse;

  bool _loadingContributions = false;
  bool get loadingContributions => _loadingContributions;

  List<ContributionResponse> _contributions = [];
  List<ContributionResponse> get contributions => _contributions;

  FundraiserAnalytics? _campaignAnalytics;
  FundraiserAnalytics? get campaignAnalytics => _campaignAnalytics;

  bool _loadingAnalytics = false;
  bool get loadingAnalytics => _loadingAnalytics;

  // --- Pagination State for All Fundraisers ---
  int _allFundraisersPage = 1;
  bool _hasMoreAllFundraisers = true;
  bool _loadingMoreAllFundraisers = false;
  bool get loadingMoreAllFundraisers => _loadingMoreAllFundraisers;

  FundraiserRepository api = FundraiserService();

  Future<void> selectCoverImage() async {
    notifyListeners();
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'png', 'jpeg'],
    );
    if (result != null) {
      _coverImage = File(result.files.single.path!);
      notifyListeners();
    }
  }

  Future<void> selectOtherOne() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'png', 'jpeg'],
    );
    if (result != null) {
      _otherOne = File(result.files.single.path!);
      notifyListeners();
    }
  }

  Future<void> selectOtherTwo() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'png', 'jpeg'],
    );
    if (result != null) {
      _otherTwo = File(result.files.single.path!);
      notifyListeners();
    }
  }

  Future<void> selectOtherThree() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'png', 'jpeg'],
    );
    if (result != null) {
      _otherThree = File(result.files.single.path!);
      notifyListeners();
    }
  }

  Future<void> getStatuses() async {
    _loadingStatuses = true;
    notifyListeners();
    if (_statuses.isEmpty) {
      _statuses = await api.getFundraiserStatuses();
    }
    _loadingStatuses = false;
    notifyListeners();
  }

  Future<void> getCategories() async {
    _loadingCategories = true;
    notifyListeners();
    if (_categories.isEmpty) {
      _categories = await api.getCategories();
    }
    _loadingCategories = false;
    notifyListeners();
  }

  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setStartDate(DateTime date) {
    _startDate = date;
    notifyListeners();
  }

  void setEndDate(DateTime date) {
    _endDate = date;
    notifyListeners();
  }

  void selectWallet(WalletSnippet wallet) {
    _selectedWallet = wallet;
    notifyListeners();
  }

  void selectWalletFull(FullWallet wallet) {
    _selectedWalletFull = wallet;
    // Also sync to snippet for backward compatibility
    _selectedWallet = WalletSnippet(
      id: wallet.id ?? 0,
      name: wallet.name ?? 'Wallet ${wallet.id ?? ''}',
      isActive: wallet.isActive ?? false,
      isLinkedToBank: wallet.isLinkedToBank ?? false,
    );
    notifyListeners();
  }

  Future<void> fetchAvailableWallets() async {
    if (_availableWallets.isEmpty) {
      _availableWallets = await api.getAvailableWallets();
      notifyListeners();
    }
  }

  void setAnalyticsPublic(bool public) {
    _publicAnalytics = public;
    notifyListeners();
  }

  void setAllowPledging(bool allow) {
    _allowPledging = allow;
    notifyListeners();
  }

  void setPublicity(bool visible) {
    _publiclyVisible = visible;
    notifyListeners();
  }

  Future<void> createFundraiser(FundraiserRequest request) async {
    if (_otherOne != null) {
      _otherImages.add(_otherOne!);
    } else if (_otherTwo != null) {
      _otherImages.add(_otherTwo!);
    } else if (_otherThree != null) {
      _otherImages.add(_otherThree!);
    }
    request.otherImages = _otherImages;
    _postingFundraiser = true;
    notifyListeners();
    _createResponse = await api.createFundraiser(request);
    if (_createResponse?.error != null) {
      Fluttertoast.showToast(msg: _createResponse!.error!);
    } else {
      _activeFundraisers.add(_createResponse!);
      if (_createResponse?.isPublic == true) {
        _allFundraisers.add(_createResponse!);
      }
    }
    _postingFundraiser = false;
    notifyListeners();
  }

  void clearFundraiser() {
    _coverImage = null;
    _otherImages.clear();
    _otherOne = null;
    _otherTwo = null;
    _otherThree = null;
    _selectedCategory = null;
    _selectedWallet = null;
    notifyListeners();
  }

  // active, inactive, cancelled, completed
  Future<void> getActiveFundraisers() async {
    _loadingActiveFundraisers = true;
    notifyListeners();
    if (_activeFundraisers.isEmpty) {
      final resp = await api.getMyFundraisers('active');
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _activeFundraisers.addAll(resp.campaigns??[]);
      }
    }
    _loadingActiveFundraisers = false;
    notifyListeners();
  }

  Future<void> getInactiveFundraisers()async{
    _loadingInactiveFundraisers=true;
    notifyListeners();
    if(_inactiveFundraisers.isEmpty){
      final resp=await api.getMyFundraisers('inactive');
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _inactiveFundraisers.addAll(resp.campaigns??[]);
      }
    }
    _loadingInactiveFundraisers=false;
    notifyListeners();
  }

  Future<void> getCancelledFundraisers()async{
    _loadingCancelledFundraisers=true;
    notifyListeners();
    if(_cancelledFundraisers.isEmpty){
      final resp=await api.getMyFundraisers('cancelled');
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _cancelledFundraisers.addAll(resp.campaigns??[]);
      }
    }
    _loadingCancelledFundraisers=false;
    notifyListeners();
  }

  Future<void> getCompletedFundraisers()async{
    _loadingCompletedFundraisers=true;
    notifyListeners();
    if(_completedFundraisers.isEmpty){
      final resp=await api.getMyFundraisers('completed');
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _completedFundraisers.addAll(resp.campaigns??[]);
      }
    }
    _loadingCompletedFundraisers=false;
    notifyListeners();
  }

  Future<void> getAllFundraisers({bool isRefresh = false}) async {
    if (isRefresh) {
      _allFundraisersPage = 1;
      _allFundraisers = [];
      _hasMoreAllFundraisers = true;
      _loadingAllFundraisers = true;
    } else {
      if (_loadingMoreAllFundraisers || !_hasMoreAllFundraisers) return;
      _loadingMoreAllFundraisers = true;
    }
    notifyListeners();

    final offset = (_allFundraisersPage - 1) * 10;
    final resp = await api.getAllFundraisers(offset);

    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _allFundraisers.addAll(resp.campaigns ?? []);
      _hasMoreAllFundraisers = resp.hasMore ?? false; // Correctly use the 'hasMore' field from the response
      if (resp.campaigns?.isNotEmpty ?? false) {
        _allFundraisersPage++;
      }
    }

    if (isRefresh) {
      _loadingAllFundraisers = false;
    } else {
      _loadingMoreAllFundraisers = false;
    }
    notifyListeners();
  }

  void selectFundraiser(FundraiserResponse fundraiser) {
    _selectedFundraiser = fundraiser;
    notifyListeners();
  }

  void resetFundraiser() {
    _selectedFundraiser = null;
    _campaignAnalytics = null;
    _campaignPledges.clear();
    _contributions.clear();
    notifyListeners();
  }

  Future<void> updateFundraiser(Map<String, dynamic> updates) async {
    _updatingFundraiser = true;
    notifyListeners();
    _updateResponse = await api.updateFundraiser(_selectedFundraiser!.id!, updates);
    if (_updateResponse?.error != null) {
      Fluttertoast.showToast(msg: _updateResponse!.error!);
    } else {
      final index = _activeFundraisers.indexWhere((el) => el.id == _selectedFundraiser!.id);
      if (index != -1) {
        _activeFundraisers[index] = _updateResponse!;
        _selectedFundraiser = _updateResponse!;
        notifyListeners();
      }
    }
    _updatingFundraiser = false;
    notifyListeners();
  }

  // pledges
  Future<void> makePledge(PledgeRequest request) async {
    _pledging = true;
    notifyListeners();
    _pledgeResponse = await api.pledgeToCampaign(_selectedFundraiser!.id!, request);
    if (_pledgeResponse?.error != null) {
      Fluttertoast.showToast(msg: _pledgeResponse!.error!);
    } else {
      _campaignPledges.add(_pledgeResponse!);
      await getMyPledges();
      await getAllFundraisers(isRefresh: true);
    }
    _pledging = false;
    notifyListeners();
  }

  Future<void> getFundraiserPledges() async {
    _loadingPledges = true;
    notifyListeners();
    if (_campaignPledges.isEmpty) {
      _campaignPledges = await api.getPledges(_selectedFundraiser!.id!);
    }
    _loadingPledges = false;
    notifyListeners();
  }

  Future<void> getMyPledges() async {
    _loadingMyPledges = true;
    notifyListeners();
    _myPledges = await api.getMyPledges();
    _loadingMyPledges = false;
    notifyListeners();
  }

  void selectPledge(PledgeResponse pledge) {
    _selectedPledge = pledge;
    notifyListeners();
  }

  void resetPledge() {
    _selectedPledge = null;
    notifyListeners();
  }


  List get pledgeForFundraiser {
    final p = _myPledges
        .where((
            el) => el.campaignId == _selectedFundraiser?.id && el.pledgerId != ProfileProvider().user?.id)
        .toList();
    return p;
  }

  Future<void> updatePledge(int pledgeId, double amount) async {
    _updatingPledge = true;
    notifyListeners();
    _pledgeResponse = await api.updatePledge(pledgeId, amount);
    if (_pledgeResponse?.error != null) {
      Fluttertoast.showToast(msg: _pledgeResponse!.error!);
    } else {
      final index = _campaignPledges.indexWhere((el) => el.id == pledgeId);
      if (index != -1) {
        _campaignPledges[index] = _pledgeResponse!;
      } else {
        _campaignPledges.add(_pledgeResponse!);
      }
    }
    _updatingPledge = false;
    notifyListeners();
  }

  Future<void> updateMyPledge(int pledgeId, double amount) async {
    _updatingPledge = true;
    notifyListeners();
    _pledgeResponse = await api.updatePledge(pledgeId, amount);
    if (_pledgeResponse?.error != null) {
      Fluttertoast.showToast(msg: _pledgeResponse!.error!);
    } else {
      final index = _myPledges.indexWhere((el) => el.id == pledgeId);
      if (index != -1) {
        _myPledges[index] = _pledgeResponse!;
      } else {
        _myPledges.add(_pledgeResponse!);
      }
    }
    _updatingPledge = false;
    notifyListeners();
  }

  void setPledgePaymentMethod(PaymentMethod option) {
    _selectedPledgeMethod = option;
    notifyListeners();
  }

  void setPledgeWallet(FullWallet wallet) {
    _pledgeWallet = wallet;
    notifyListeners();
  }

  void setPledgeBank(FullBank bank) {
    _pledgeBank = bank;
    notifyListeners();
  }

  void resetPledgingFields() {
    _selectedPledgeMethod = null;
    _pledgeWallet = null;
    _pledgeBank = null;
    notifyListeners();
  }

  Future<void> processPledgePayment(int pledgeId, PledgePaymentRequest request) async {
    _processingPledge = true;
    notifyListeners();
    _pledgePaymentResponse = await api.processPledgePayment(pledgeId, request);
    if (_pledgePaymentResponse?.error != null) {
      Fluttertoast.showToast(msg: _pledgePaymentResponse!.error!);
    } else {
      final index = _myPledges.indexWhere((el) => el.id == pledgeId);
      if (index != -1) {
        _myPledges[index].amountPaid = (_myPledges[index].amountPaid!) +
            (_pledgePaymentResponse!.paymentAmount!);
        _myPledges[index].amountRemaining = _pledgePaymentResponse!.amountRemaining;
      }
    }
    _processingPledge = false;
    notifyListeners();
  }

  // contributions
  void setContributionMethod(PaymentMethod option) {
    _selectedContributionMethod = option;
    notifyListeners();
  }

  void setContributionWallet(FullWallet wallet) {
    _contributionWallet = wallet;
    notifyListeners();
  }

  void setContributionBank(FullBank bank) {
    _contributionBank = bank;
    notifyListeners();
  }

  Future<void> contributeToCampaign(ContributionRequest request) async {
    _contributing = true;
    notifyListeners();
    debugPrint(request.toJson().toString());
    _contributionResponse = await api.contributeToCampaign(
        _selectedFundraiser!.id!, request);
    if (_contributionResponse?.error != null) {
      Fluttertoast.showToast(msg: _contributionResponse!.error!);
    } else {
      _contributions.add(_contributionResponse!);
      await getAllFundraisers(isRefresh: true);
      await getMyContributions();
    }
    _contributing = false;
    notifyListeners();
  }

  void resetContributionFields() {
    _contributionWallet = null;
    _contributionBank = null;
    notifyListeners();
  }

  Future<void> getMyContributions() async {
    _loadingContributions = true;
    notifyListeners();
    if (_contributions.isEmpty) {
      _contributions = await api.getMyContributions(_selectedFundraiser!.id!);
    }
    _loadingContributions = false;
    notifyListeners();
  }

  Future<void> getCampaignAnalytics() async {
    _loadingAnalytics = true;
    notifyListeners();
    _campaignAnalytics =
        await api.getCampaignAnalytics(_selectedFundraiser!.id!);
    _loadingAnalytics = false;
    notifyListeners();
  }


  void clearLists(){
    _allFundraisers.clear();
    _activeFundraisers.clear();
    _inactiveFundraisers.clear();
    _cancelledFundraisers.clear();
    _completedFundraisers.clear();
    _myPledges.clear();
    notifyListeners();
  }
}
