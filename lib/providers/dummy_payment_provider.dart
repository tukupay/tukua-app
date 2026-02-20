import 'package:flutter/foundation.dart';
import 'package:tuku/models/models.dart';

class DummyPaymentProvider extends ChangeNotifier{
  DummyPaymentOption? _selectedTopUpMethod;
  DummyPaymentOption? get selectedTopUpMethod=>_selectedTopUpMethod;

  DummyPaymentOption? _selectedSendMethod;
  DummyPaymentOption? get selectedSendMethod=>_selectedSendMethod;

  DummyPaymentOption? _selectedLipaMpesa;
  DummyPaymentOption? get selectedLipaMpesa=>_selectedLipaMpesa;

  DummyPaymentOption? _selectedCoop;
  DummyPaymentOption? get selectedCoop=>_selectedCoop??dummyCoops[0];

  DummyPaymentOption? _selectedCard;
  DummyPaymentOption? get selectedCard=>_selectedCard??dummyCards[0];

  DummyPaymentOption? _selectedBank;
  DummyPaymentOption? get selectedBank=>_selectedBank??dummyBanks[0];

  bool _processing=false;
  bool get processing=>_processing;

  void selectTopUpMethod(DummyPaymentOption method){
    _selectedTopUpMethod=method;
    notifyListeners();
  }

  void resetTopUpMethod(){
    _selectedTopUpMethod=null;
    notifyListeners();
  }

  void selectCoop(DummyPaymentOption coop){
    _selectedCoop=coop;
    notifyListeners();
  }

  void selectCard(DummyPaymentOption card){
    _selectedCard=card;
    notifyListeners();
  }

  void selectBank(DummyPaymentOption bank){
    _selectedBank=bank;
    notifyListeners();
  }

  void selectSendMethod(DummyPaymentOption method){
    _selectedSendMethod=method;
    notifyListeners();
  }

  void resetSendMethod(){
    _selectedSendMethod=null;
    notifyListeners();
  }

  void selectLipaMpesa(DummyPaymentOption method){
    _selectedLipaMpesa=method;
    notifyListeners();
  }

  void processPayment(){
    _processing=true;
    notifyListeners();
    Future.delayed(const Duration(milliseconds: 3000),(){
      _processing=false;
      notifyListeners();
    });
  }


}