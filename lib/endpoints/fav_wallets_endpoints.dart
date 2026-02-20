import 'package:tuku/endpoints/endpoints.dart';

class FavWalletsEndpoints{
  // /api/v1/
  static const route='/favourite-wallets';

  String get prefix=>'${Configs.root}$route';

  String get favourite=>prefix;

  String favWallet(int favId){
    return '$prefix/$favId';
  }
}