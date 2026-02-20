import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:sms_sender/sms_sender.dart';

class LocalSmsProvider extends ChangeNotifier{
  List<Map<String,dynamic>> _simCards=[];
  List<Map<String,dynamic>> get simCards=>_simCards;

  int? _selectedSimIndex;
  int? get selectedSimIndex=>_selectedSimIndex;

  bool _sending=false;
  bool get sending=>_sending;

  Future<void> fetchSimCards()async{
    try{
      if(_simCards.isEmpty){
        _simCards=await SmsSender.getSimCards();
        notifyListeners();
      }
      debugPrint("SIM CARDS: $_simCards");
    }catch(e){
      Fluttertoast.showToast(msg: "Error getting SIM cards: $e");
    }
  }

  void selectSim(int index){
    _selectedSimIndex=index;
    notifyListeners();
  }


  Future<void> sendSms(String message,List<String> phoneNumbers)async{
    _sending=true;
    notifyListeners();
    try{
      for(String phone in phoneNumbers){
        String result = await SmsSender.sendSms(
            phoneNumber: phone,
            simSlot: _selectedSimIndex??0,
            message: message);
        Fluttertoast.showToast(msg: result);
      }
    }catch(e){
      Fluttertoast.showToast(msg: "Error Sending SMS: $e");
    }
    _sending=false;
    notifyListeners();
  }
}