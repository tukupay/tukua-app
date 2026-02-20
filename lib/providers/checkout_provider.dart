import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class CheckoutProvider extends ChangeNotifier{

  List<CheckoutType> _checkoutTypes=[];
  List<CheckoutType> get checkoutTypes => checkoutTypes;

  bool _generatingLink=false;
  bool get generatingLink => _generatingLink;

  CheckoutResponse? _checkoutResp;
  CheckoutResponse? get checkoutResp => _checkoutResp;

  CheckoutsRepository api=CheckoutsService();

  Future<void> getLinkTypes()async{
    _checkoutTypes=await api.getLinkTypes();
    notifyListeners();
  }

  Future<void> createCheckoutLink(CheckoutRequest request)async {
    _generatingLink = true;
    notifyListeners();
    debugPrint(request.toJson().toString());
    _checkoutResp = await api.createCheckoutLink(request);
    if(_checkoutResp?.error!=null){
      Fluttertoast.showToast(msg: _checkoutResp!.error!);
    }
    _generatingLink = false;
    notifyListeners();
    }

    void reset(){
      _checkoutResp=null;
      notifyListeners();
    }

}