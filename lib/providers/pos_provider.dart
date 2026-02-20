import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get_it/get_it.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

import '../models/models.dart';

class PosProvider extends ChangeNotifier{
  bool _includeWithdrawal=true;
  bool get includeWithdrawal=>_includeWithdrawal;

  FullWallet? _recipientWallet;
  FullWallet? get recipientWallet=>_recipientWallet;

  String? _selectedMode;
  String? get selectedMode=>_selectedMode;

  bool _loadingRecents=false;
  bool get loadingRecents=>_loadingRecents;

  List<Transaction> _recentTransactions=[];
  List<Transaction> get recentTransactions=>_recentTransactions;

  bool _loadingTransactions=false;
  bool get loadingTransactions=>_loadingTransactions;

  List<Transaction> _transactions=[];
  List<Transaction> get transactions=>_transactions;

  Transaction? _selectedTransaction;
  Transaction? get selectedTransaction=>_selectedTransaction;

  // --- pagination state ---
  int _currentPage=1;
  bool _hasMorePages=true;
  bool _loadingMore=false;
  bool get loadingMore=>_loadingMore;

  // Date range helper for transaction fetching
  DateTime _dateOnly([int daysAgo = 0]) {
    final now = DateTime.now().subtract(Duration(days: daysAgo));
    return DateTime(now.year, now.month, now.day);
  }
  DateTime get start => _dateOnly(90);
  DateTime get end => _dateOnly();

  String? _businessName;
  String? get businessName => _businessName;

  String? _businessType;
  String? get businessType => _businessType;

  String? _businessDescription;
  String? get businessDescription => _businessDescription;

  bool _submittingSetup = false;
  bool get submittingSetup => _submittingSetup;

  // POS wallet ID stored locally
  int? _posWalletId;
  int? get posWalletId => _posWalletId;

  TransactionsRepository transactionsApi=TransactionsService();
  PosRepository posApi=PosService();


  void changeIncludeWithdraw(bool val){
    _includeWithdrawal=val;
    notifyListeners();
  }

  void setRecipientWallet(FullWallet wallet){
    _recipientWallet=wallet;
    notifyListeners();
  }

  void setPaymentMode(String mode){
    _selectedMode=mode;
    notifyListeners();
  }

  /// Set POS wallet ID (local only)
  void setPosWalletId(int? walletId) {
    _posWalletId = walletId;
    notifyListeners();
  }

  /// Save POS wallet selection to local storage
  Future<void> savePosWallet(int walletId) async {
    _posWalletId = walletId;
    notifyListeners();

    try {
      final gi = GetIt.instance;
      ProfileProvider profileProvider;
      if (gi.isRegistered<ProfileProvider>()) {
        profileProvider = gi<ProfileProvider>();
      } else {
        return;
      }

      final local = LocalUserService();
      final localUser = await local.getUser();
      if (localUser != null) {
        localUser.posWalletId = walletId;
        await local.saveLocalUser(localUser);
        profileProvider.setUser(localUser);
      }
    } catch (e) {
      Fluttertoast.showToast(msg: 'Failed to save POS wallet');
    }
  }

  /// Load POS wallet ID from local storage
  Future<void> loadPosWalletId() async {
    try {
      final local = LocalUserService();
      final localUser = await local.getUser();
      if (localUser != null && localUser.posWalletId != null) {
        _posWalletId = localUser.posWalletId;
        notifyListeners();
      }
    } catch (e) {
      // Ignore
    }
  }


  Future<void> createProfile(PosRequest request) async {
    _submittingSetup = true;
    notifyListeners();
    final resp=await posApi.createProfile(request);
    if(resp.error==null){
      Fluttertoast.showToast(msg: 'STK POS is ready');
      // ---- Update ProfileProvider user state ----
      try{
        final gi = GetIt.instance;
        ProfileProvider profileProvider;
        if(gi.isRegistered<ProfileProvider>()){
          profileProvider = gi<ProfileProvider>();
        }else{
          // register a singleton so other parts of app can use it too
          gi.registerSingleton(ProfileProvider());
          profileProvider = gi<ProfileProvider>();
        }

        // fetch local user from storage and set it on the profile provider
        final local = LocalUserService();
        final localUser = await local.getUser();
        if(localUser!=null){
          localUser.posName=resp.name;
          localUser.posType=resp.type;
          localUser.posStatus=resp.status;
          localUser.posDescription=resp.description;
          // Save wallet ID from request if provided
          if(request.walletId != null){
            localUser.posWalletId = request.walletId;
          }
          await local.saveLocalUser(localUser);
          profileProvider.setUser(localUser);
        }
      }catch(e){
        // don't crash the flow if updating profile fails
        Fluttertoast.showToast(msg: 'POS created but failed to refresh profile');
      }

    }else{
      Fluttertoast.showToast(msg: resp.error!);
    }
    _submittingSetup = false;
    notifyListeners();
  }

  Future<void> updateProfile(PosRequest request,BuildContext context)async {
    _submittingSetup = true;
    notifyListeners();
    final resp = await posApi.updateProfile(request);
    if(resp.error==null) {
      Fluttertoast.showToast(msg: 'POS profile updated');
      // ---- Update ProfileProvider user state ----
      try{
        final gi = GetIt.instance;
        ProfileProvider profileProvider;
        if(gi.isRegistered<ProfileProvider>()) {
          profileProvider = gi<ProfileProvider>();
        }
        else {
          // register a singleton so other parts of app can use it too
          gi.registerSingleton(ProfileProvider());
          profileProvider = gi<ProfileProvider>();
        }

        // fetch local user from storage and set it on the profile provider
        final local = LocalUserService();
        final localUser = await local.getUser();
        if(localUser!=null){
          localUser.posName=resp.name;
          // Proper capitalization for type
          if(resp.type != null && resp.type!.isNotEmpty){
            localUser.posType='${resp.type![0].toUpperCase()}${resp.type!.substring(1).toLowerCase()}';
          }
          localUser.posStatus=resp.status;
          localUser.posDescription=resp.description;
          // Save wallet ID from request if provided
          if(request.walletId != null){
            localUser.posWalletId = request.walletId;
          }
          await local.saveLocalUser(localUser);
          profileProvider.setUser(localUser);
        }
      }catch(e){
        // don't crash the flow if updating profile fails
        Fluttertoast.showToast(msg: 'POS updated but failed to refresh profile');
      }
      Navigator.pop(context);
    } else {
      Fluttertoast.showToast(msg: resp.error!);
    }
    _submittingSetup = false;
    notifyListeners();
  }

  Future<void> getRecentPosTransactions()async{
    _loadingRecents=true;
    notifyListeners();
    if(_recentTransactions.isEmpty){
      final resp=await transactionsApi.getPosRecents(start, end);
      if(resp.error!=null){
        Fluttertoast.showToast(msg: resp.error!);
      }else{
        _recentTransactions=resp.transactions!;
      }
    }
    _loadingRecents=false;
    notifyListeners();
  }

  Future<void> getPosTransactions({bool isRefresh=false})async{
    if (isRefresh) {
      _currentPage = 1;
      _transactions = [];
      _hasMorePages = true;
      _loadingTransactions = true;
    } else {
      if (_loadingMore || !_hasMorePages) return;
      _loadingMore = true;
    }
    notifyListeners();

    final offset = (_currentPage - 1) * 15;
    final resp=await transactionsApi.getPosTransactions(offset, start, end);

    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      _transactions.addAll(resp.transactions ?? []);
      _hasMorePages = resp.hasMore ?? false;
      if(resp.transactions?.isNotEmpty??false){
        _currentPage++;
      }
    }
    
    if(isRefresh){
      _loadingTransactions=false;
    }else{
      _loadingMore = false;
    }
    notifyListeners();
  }

  void selectTransaction(Transaction transaction){
    _selectedTransaction=transaction;
    notifyListeners();
  }
}
