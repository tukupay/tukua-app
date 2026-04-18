import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppState extends ChangeNotifier{

  String? _accountType;
  String? get accountType=>_accountType;

  int _selectedTab=0;
  int get selectedTab=>_selectedTab;

  bool _hideBalance=true;
  bool get hideBalance=>_hideBalance;
  
  int _currentWallet=0;
  int get currentWallet=>_currentWallet;

  Future<void> getAccountType()async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    String? storedType=prefs.getString('account_type');
    _accountType=storedType;
    notifyListeners();
  }

  Future<void> setAccountType(String type)async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    await prefs.setString('account_type', type);
    _accountType=type;
    notifyListeners();
  }

  Future<void> resetAccountType()async{
    SharedPreferences prefs=await SharedPreferences.getInstance();
    await prefs.remove('account_type');
    _accountType=null;
    notifyListeners();
  }

  void selectTab(int index){
    _selectedTab=index;
    notifyListeners();
  }

  void toggleBalance(){
    _hideBalance=!_hideBalance;
    notifyListeners();
  }

  void selectWallet(int index){
    _currentWallet=index;
    notifyListeners();
  }
}
