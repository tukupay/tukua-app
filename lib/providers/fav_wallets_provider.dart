import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class FavWalletsProvider extends ChangeNotifier{
  bool _addingFav=false;
  bool get addingFav => _addingFav;

  FavWalletResponse? _favResponse;
  FavWalletResponse? get favResponse => _favResponse;


  bool _loadingFavs=false;
  bool get loadingFavs => _loadingFavs;

  bool _deletingFav=false;
  bool get deletingFav => _deletingFav;

  List<FavWalletResponse> _favWallets=[];
  List<FavWalletResponse> get favWallets => _favWallets;

  FavWalletsRepository api=FavWalletsService();

  Future<void> addFavWallet(FavWalletRequest request) async {
    debugPrint(request.toJson().toString());
    _addingFav=true;
    notifyListeners();
    _favResponse=await api.createFavWallet(request);
    if(_favResponse?.error==null){
      _favWallets.add(_favResponse!);
    }else{
      Fluttertoast.showToast(msg: _favResponse!.error!);
    }
    _addingFav=false;
    notifyListeners();
  }

  Future<void> getFavWallets() async {
    _loadingFavs=true;
    notifyListeners();
    _favWallets = await api.getFavWallets();
    _loadingFavs=false;
    notifyListeners();
  }


}