import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class CreditsProvider extends ChangeNotifier{

  // balance
  bool _loadingBalance=false;
  bool get loadingBalance=>_loadingBalance;

  CreditBalance? _creditBalance;
  CreditBalance? get creditBalance=>_creditBalance;

  // tier pricing
  bool _loadingTierPricing=false;
  bool get loadingTierPricing=>_loadingTierPricing;

  CreditTierPricing? _creditPricing;
  CreditTierPricing? get creditPricing=>_creditPricing;

  // transaction history
  bool _loadingTransactionHistory=false;
  bool get loadingTransactionHistory=>_loadingTransactionHistory;

  SmsTransactionHistory? _transactionHistory;
  SmsTransactionHistory? get transactionHistory=>_transactionHistory;

  // purchase credits
  bool _purchasingCredits=false;
  bool get purchasingCredits=>_purchasingCredits;

  String? _purchaseCreditsError;
  String? get purchaseCreditsError=>_purchaseCreditsError;


  CreditsRepository api=CreditsService();

  Future<void> getCreditBalance()async{
    _loadingBalance=true;
    notifyListeners();
    _creditBalance=await api.getCreditBalance();
    _loadingBalance=false;
    notifyListeners();
  }

  Future<void> getCreditPricing(int amount)async{
    _creditPricing=null;
    _loadingTierPricing=true;
    notifyListeners();
    _creditPricing=await api.getCreditPricing(amount);
    _loadingTierPricing=false;
    notifyListeners();
  }

  void resetCreditPricing(){
    _creditPricing=null;
    notifyListeners();
  }

  Future<void> getTransactionHistory()async{
    _loadingTransactionHistory=true;
    notifyListeners();
    final resp=await api.getTransactionHistory();
    if(resp.error!=null){
      Fluttertoast.showToast(msg: resp.error!);
    }else{
      _transactionHistory=resp;
    }
    _loadingTransactionHistory=false;
    notifyListeners();
  }

}