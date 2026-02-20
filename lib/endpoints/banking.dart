import 'package:tuku/endpoints/endpoints.dart';

class Banking{
  static const route='/bank-accounts';

  String get prefix=>'${Configs.root}$route/';

  String get availableBanks=>'${prefix}banks';

  String get createBank=>prefix;

  String  accountsForWallet(int walletId){
   return '${prefix}wallet/$walletId';
  }

  String get myAccounts=>'${prefix}my-accounts';

  String getBankAccount(int id){
    return '$prefix$id';
  }

  String toggleFavourite(int id){
    return '$prefix$id/toggle-favourite';
  }

  String get getFavourites=>'${prefix}favourites';


}