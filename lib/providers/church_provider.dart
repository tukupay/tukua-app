import 'package:flutter/foundation.dart';

class ChurchProvider extends ChangeNotifier{

  bool _creatingWallet=false;
  bool get creatingWallet=>_creatingWallet;

  bool _isInstalled = true;
  bool get isInstalled => _isInstalled;

  void setCreatingWallet(bool val){
    _creatingWallet=true;
    notifyListeners();
  }

  /// Install the merchant/church
  void installMerchant() {
    _isInstalled = true;
    notifyListeners();
  }

  /// Uninstall the merchant/church
  void uninstallMerchant() {
    _isInstalled = false;
    notifyListeners();
  }

  void selectChurch(){}
}