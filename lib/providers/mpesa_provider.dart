import 'package:flutter/foundation.dart';
import 'package:tuku/constants/constants.dart';

class MpesaProvider extends ChangeNotifier{
  String _option=Strings.buyGoods;
  String get option=>_option;

  void changeOption(String val){
    _option=val;
    notifyListeners();
  }
}