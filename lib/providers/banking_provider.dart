import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';

import '../services/services.dart';

class BankingProvider extends ChangeNotifier{

  List<AvailableBank> _availableBanks=[];
  List<AvailableBank> get availableBanks=>_availableBanks;

  bool _loadingAvailableBanks=false;
  bool get loadingAvailableBanks=>_loadingAvailableBanks;

  AvailableBank? _selectedAvailableBank;
  AvailableBank? get selectedAvailableBank=>_selectedAvailableBank;

  bool _loadingAccounts=false;
  bool get loadingAccounts=>_loadingAccounts;

  List<FullBank> _userBanks=[];
  List<FullBank> get userBanks=>_userBanks;

  bool _loadingWalletBanks=false;
  bool get loadingWalletBanks=>_loadingWalletBanks;

  List<FullBank> _walletBanks=[];
  List<FullBank> get walletBanks=>_walletBanks;

  // creating
  WalletType? _selectedType;
  WalletType? get selectedType=>_selectedType;


  bool _creatingBank=false;
  bool get creatingBank=>_creatingBank;

  FullBank? _newBank;
  FullBank? get newBank=>_newBank;

  // browse bank
  FullBank? _selectedBank;
  FullBank? get selectedBank=>_selectedBank;

  bool _loadingBankInfo=false;
  bool get loadingBankInfo=>_loadingBankInfo;

  // favourites
  bool _togglingFav=false;
  bool get togglingFav=>_togglingFav;

  FullBank? _selectedFav;
  FullBank? get selectedFav=>_selectedFav;


  FullBank? _favResponse;
  FullBank? get favResponse=>_favResponse;

  bool _loadingFavourites=true;
  bool get loadingFavourites=>_loadingFavourites;

  List<FullBank> _favourites=[];
  List<FullBank> get favourites=>_favourites;


  BankingRepository api=BankingService();

  Future<void> getAvailableBanks()async{
    _loadingAvailableBanks=true;
    notifyListeners();
    if(_availableBanks.isEmpty){
      _availableBanks=await api.availableBanks();
    }
    debugPrint("AVAILABLE BANKS FOUND ${_availableBanks.length}");
    _loadingAvailableBanks=false;
    notifyListeners();
  }

  void selectMainBank(AvailableBank bank){
    _selectedAvailableBank=bank;
    notifyListeners();
  }


  Future<void> createBank(BankRequest bank)async{
    _creatingBank=true;
    notifyListeners();
    debugPrint(bank.toJson().toString());
    _newBank=await api.createBankAccount(bank);
    if(_newBank?.error==null){
      _userBanks.add(_newBank!);
      _selectedType=null;
    }else{
      Fluttertoast.showToast(msg: _newBank!.error!);
    }
    _creatingBank=false;
    notifyListeners();
  }

  Future<void> getUserBanks()async{
    _loadingAccounts=true;
    notifyListeners();
    _userBanks=await api.getMyBankAccounts();
    _loadingAccounts=false;
    notifyListeners();
  }

  void selectBank(FullBank bank){
    _selectedBank=bank;
    notifyListeners();
  }

  void resetBank(){
    _selectedBank=null;
    notifyListeners();
  }

  Future<void> getWalletBanks(int walletId)async{
    _loadingWalletBanks=true;
    notifyListeners();
    _walletBanks=await api.getAccountsForWallet(walletId);
    debugPrint("WALLET BANKS ACCOUNTS FOUND ${_walletBanks.length}");
    _loadingWalletBanks=false;
    notifyListeners();
  }

  void selectFavBank(FullBank bank){
    _selectedFav=bank;
    notifyListeners();
  }

  void resetFavBank(){
    _selectedFav=null;
    notifyListeners();
  }

  Future<void> toggleFavourite(int id)async{
    _togglingFav=true;
    notifyListeners();
    _favResponse=await api.toggleFavourite(id);
    if(_favResponse?.error==null){
      _favourites.add(_favResponse!);
    }else{
      Fluttertoast.showToast(msg: _favResponse!.error!);
    }
    _togglingFav=false;
    notifyListeners();
  }

  Future<void> getFavourites()async{
    _loadingFavourites=true;
    notifyListeners();
    if(_favourites.isEmpty){
      final favs=await api.getFavourites();
      _favourites.addAll(favs.bankAccounts??[]);
      debugPrint("FAVOURITES ACCOUNTS FOUND ${_favourites.length}");
    }
    _loadingFavourites=false;
    notifyListeners();
  }

}