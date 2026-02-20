import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/services/services.dart';

class WalletProvider extends ChangeNotifier{

  int _currentStep=0;
  int get currentStep=>_currentStep;

  // wallet types
  bool _loadingTypes=false;
  bool get loadingTypes=>_loadingTypes;

  List<WalletType> _walletTypes=[];
  List<WalletType> get walletTypes=>_walletTypes;

  bool _loadingWallets=false;
  bool get loadingWallets=>_loadingWallets;

  bool _fetched=false;
  bool get fetched=>_fetched;

  // user wallets
  String? _walletName;
  String? get walletName=>_walletName;

  bool _creatingWallet=false;
  bool get creatingWallet=>_creatingWallet;

  List<Signatory> _newSignatories=[];
  List<Signatory> get newSignatories=>_newSignatories;

  WalletType? _selectedType;
  WalletType? get selectedType=>_selectedType;

  bool _autoSettle=false;
  bool get autoSettle=>_autoSettle;

  double? _autoThreshold;
  double? get autoThreshold=>_autoThreshold;

  double? _autoSettleAmount;
  double? get autoSettleAmount=>_autoSettleAmount;

  FullBank? _selectedBank;
  FullBank? get selectedBank=>_selectedBank;

  FullWallet? _newWallet;
  FullWallet? get newWallet=>_newWallet;

  List<FullWallet> _userWallets=[];
  List<FullWallet> get userWallets=>_userWallets;

  FullWallet? _selectedWallet;
  FullWallet? get selectedWallet=>_selectedWallet;

  bool _loading=false;
  bool get loading=>_loading;

  String? _deleteResp;
  String? get deleteResp=>_deleteResp;

  Map<String,dynamic> _updates={};
  Map<String,dynamic> get updates=>_updates;

  FullWallet? _updateResp;
  FullWallet? get updateResp=>_updateResp;

  WalletSearchResult? _searchResult;
  WalletSearchResult? get searchResult=>_searchResult;

  bool _searching=false;
  bool get searching=>_searching;

  bool _attachingBankAcc=false;
  bool get attachingBankAcc=>_attachingBankAcc;

  bool _detachingBankAcc=false;
  bool get detachingBankAcc=>_detachingBankAcc;

  bool _loadingWalletTransactions=false;
  bool get loadingWalletTransactions=>_loadingWalletTransactions;

  List<Transaction> _walletTransactions = [];
  List<Transaction> get walletTransactions => _walletTransactions;

  // --- Pagination State ---
  int _currentPage = 1;
  bool _hasMorePages = true;
  bool _loadingMore = false;
  bool get loadingMore => _loadingMore;

  // Date range helper for transaction fetching
  DateTime _dateOnly([int moreDays = 0]) {
    final now = DateTime.now().add(Duration(days: moreDays));
    return DateTime(now.year, now.month, now.day);
  }
  DateTime get start => _dateOnly();
  DateTime get end => _dateOnly(90);


  WalletRepository api=WalletService();

  void stepBack(){
    if(_currentStep>=0){
      _currentStep--;
      notifyListeners();
    }
  }

  void nextStep(){
   if(_currentStep<2){
     _currentStep++;
     notifyListeners();
   }
  }

  void resetSteps(){
    _currentStep=0;
    notifyListeners();
  }

  Future<void> getWalletTypes()async{
    _loadingTypes=true;
    notifyListeners();
    if(_walletTypes.isEmpty){
      _walletTypes=await api.getWalletTypes();
    }
    debugPrint('${_walletTypes.length.toString()} WALLET TYPES FOUND');
    _loadingTypes=false;
    notifyListeners();
  }

  void updateWalletName(String name){
    _walletName=name;
    notifyListeners();
  }


  void updateSettleAmount(String val){
    _autoSettleAmount=double.tryParse(val);
    debugPrint("AMT IS $val");
    notifyListeners();
  }

  void selectedWalletType(WalletType? type){
    _selectedType=type;
    notifyListeners();
  }

  void selectBank(FullBank bank){
   if(_selectedBank==bank){
     _selectedBank=null;
   }else{
     _selectedBank=bank;
   }
    notifyListeners();
  }

  void toggleAutoSettle(bool val){
    _autoSettle=val;
    notifyListeners();
  }

  void addSignatory(Signatory signatory){
    _newSignatories.add(signatory);
    notifyListeners();
  }

  void removeSignatory(int index){
    _newSignatories.removeAt(index);
    notifyListeners();
  }

  Future<void> createWallet(WalletRequest wallet)async{
    _creatingWallet=true;
    notifyListeners();
    wallet.name=_walletName!;
    wallet.typeId=_selectedType?.id??_walletTypes[0].id;
    wallet.signatories=newSignatories;
    // wallet.bank=_selectedBank?.bankName;
    wallet.autoSettlementAmount=_autoSettleAmount;
    wallet.autoSettlementThreshold=_autoThreshold;
    wallet.bankAccId=_selectedBank?.id;
    wallet.settlementType=_autoSettle==true?'automatic':'manual';
    wallet.signatories=_newSignatories;
    debugPrint(wallet.toJson().toString());
    _newWallet=await api.createWallet(wallet);
    if(_newWallet!.error!=null){
      Fluttertoast.showToast(msg: _newWallet!.error!);
    }else{
      _userWallets.add(_newWallet!);
      _newSignatories.clear();
      _selectedType=null;
    }
    _creatingWallet=false;
    notifyListeners();
  }

  Future<void> listWallets()async{
    _loadingWallets=true;
    notifyListeners();
    final profile=ProfileProvider();
    await profile.getUser();
    _userWallets=await api.listWallets(profile.user!.userId!);
    debugPrint("${_userWallets.length} WALLETS FOUND");
    _fetched=true;
    _loadingWallets=false;
    notifyListeners();
  }

  Future<void> getWallet()async{
    _loading=true;
    notifyListeners();
    _selectedWallet=await api.getWallet(_selectedWallet!.id!);
    _loading=false;
    notifyListeners();
  }

  void selectWallet(FullWallet wallet){
    _selectedWallet=wallet;
    notifyListeners();
  }

  void resetWallet(){
    _selectedWallet=null;
    notifyListeners();
  }

  Future<void> updateWallet()async{
    _loading=true;
    notifyListeners();
    _updateResp=await api.updateWallet(_selectedWallet!.id!,_updates);
    if(_updateResp?.error!=null){
      Fluttertoast.showToast(msg: _updateResp!.error!);
    }else{
      final index=_userWallets.indexWhere((el)=>el.id==_selectedWallet!.id);
      if(index>=0){
        _userWallets[index]=_updateResp!;
        _selectedWallet=_updateResp;
        notifyListeners();
      }
    }
    _loading=false;
    notifyListeners();
  }

  Future<void> deleteWallet()async{
    _loading=true;
    notifyListeners();
    _deleteResp=await api.deleteWallet(_selectedWallet!.id!);
    if(_deleteResp!=null){
      Fluttertoast.showToast(msg: _deleteResp!);
    }else{
      final index=_userWallets.indexWhere((el)=>el.id==_selectedWallet!.id);
      if(index!=-1){
        _userWallets.removeAt(index);
      }
    }
    _loading=false;
    notifyListeners();
  }

  Future<void> setPrimaryWallet()async{
    _loading=true;
    notifyListeners();
    final resp=await api.setPrimaryWallet(_selectedWallet!.id!);
    if(resp.isNotEmpty){
      Fluttertoast.showToast(msg: resp);
    }
    if(_userWallets.where((el)=>el.isPrimary==true).isNotEmpty){
      _userWallets.firstWhere((el)=>el.isPrimary==true).isPrimary=false;
    }
    _selectedWallet?.isPrimary=true;
    _loading=false;
    notifyListeners();
  }

  void updateWalletBalance(int walletId,double balance){
    final index=_userWallets.indexWhere((el)=>el.id==walletId);
    if(index!=-1){
      _userWallets[index].balance=balance;
      notifyListeners();
    }
  }

  Future<void> searchWallets(String query)async{
    _searching=true;
    notifyListeners();
    _searchResult=await api.searchWallets(query);
    _searching=false;
    notifyListeners();
  }

  void resetSearch() {
    _searchResult = null;
    notifyListeners();
  }

  Future<void> attachBankAccount(int bankId)async{
    _attachingBankAcc=true;
    notifyListeners();
    final resp=await api.attachBankAccount(_selectedWallet!.id!,bankId);
    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      final index=_userWallets.indexWhere((el)=>el.id==_selectedWallet!.id);
      if(index>0){
        _userWallets[index]=resp;
        _selectedWallet=resp;
        notifyListeners();
      }
    }
    _attachingBankAcc=false;
    notifyListeners();
  }

  Future<void> detachBankAccount()async{
    _detachingBankAcc=true;
    notifyListeners();
    final resp=await api.detachBankAccount(_selectedWallet!.bankAccountId!);
    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      final index=_userWallets.indexWhere((el)=>el.id==_selectedWallet!.id);
      if(index>0){
        _userWallets[index]=resp;
        _selectedWallet=resp;
        notifyListeners();
      }
    }
    _detachingBankAcc=false;
    notifyListeners();
  }

  Future<void> getWalletTransactions({bool isRefresh=false})async{
    if(isRefresh){
      _currentPage=1;
      _walletTransactions=[];
      _hasMorePages=true;
      _loadingWalletTransactions=true;
    }else{
      if(_loadingMore||!_hasMorePages)return;
      _loadingMore=true;
    }
    notifyListeners();
   if(_selectedWallet!=null){
     final offset = (_currentPage - 1) * 15;
     final resp = await api
         .getWalletTransactions(_selectedWallet!.id!, offset,start,end);
     if (resp.error!=null){
       Fluttertoast.showToast(msg: resp.error!);
     }else{
       _walletTransactions.addAll(resp.transactions??[]);
       _hasMorePages=resp.hasMore ?? false;
       if(resp.transactions?.isNotEmpty ?? false) {
         _currentPage++;
       }
     }
   }
   if(isRefresh){
     _loadingWalletTransactions=false;
   }else{
     _loadingMore=false;
   }
   notifyListeners();
  }

  void clearWalletTransactions(){
    _walletTransactions.clear();
    _selectedWallet=null;
    notifyListeners();
  }
}

List<Widget> walletSteps=[
  WalletDetails(),
  SignatoryDetails()
];