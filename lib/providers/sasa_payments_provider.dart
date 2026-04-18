import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../repository/repository.dart';
import '../services/services.dart';

class SasaPaymentsProvider extends ChangeNotifier{

  // ── Wallet types ──
  bool _loadingWalletTypes = false;
  bool get loadingWalletTypes => _loadingWalletTypes;

  List<SasaWalletType> _walletTypes = [];
  List<SasaWalletType> get walletTypes => _walletTypes;

  String? _selectedId;
  String? get selectedId=>_selectedId;


  SasaPayRepository api=SasaPayService();

  Future<void> getWalletTypes()async{
    _loadingWalletTypes=true;
    notifyListeners();
    if(_walletTypes.isEmpty){
      _walletTypes=await api.getWalletTypes();
    }
    _loadingWalletTypes=false;
    notifyListeners();
  }

  void selectWalletType(String id){
    _selectedId=id;
    notifyListeners();
  }
}