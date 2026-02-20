import 'package:flutter/foundation.dart';

class AppState extends ChangeNotifier{
  int _selectedTab=0;
  int get selectedTab=>_selectedTab;

  bool _hideBalance=true;
  bool get hideBalance=>_hideBalance;
  
  int _currentWallet=0;
  int get currentWallet=>_currentWallet;


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
