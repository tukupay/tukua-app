import 'package:tuku/models/models.dart';

abstract class FavWalletsRepository{
  Future<FavWalletResponse> createFavWallet(FavWalletRequest fav);

  Future<List<FavWalletResponse>> getFavWallets();

  Future<FavWalletResponse> getFavWallet(int favId);

  Future<FavWalletResponse> updateFavWallet(int favId, FavWalletRequest fav);

  Future<String?> deleteFavWallet(int favId);

}
