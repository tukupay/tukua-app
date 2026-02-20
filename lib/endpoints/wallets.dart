import 'package:tuku/endpoints/endpoints.dart';

class Wallets{
  static const route='/wallets';

  String get prefix=>'${Configs.root}$route/';

  String get walletType=>'${Configs.root}/wallet-types/simple';

  String get createWallet=>prefix;

  String listWallets(int userId){
    return '${prefix}user/$userId';
  }

  String  getWallet(int walletId){
    return '$prefix$walletId';
  }

  String updateWallet(int walletId){
    return '$prefix$walletId';
  }

  String deleteWallet(int walletId){
    return'$prefix$walletId';
  }

  String setPrimaryWallet(int walletId){
    return '${prefix}set-primary/$walletId';
  }

  String search(String query){
    if(query.length==6){
      return '${prefix}search?alias=$query';
    }else {
      return '${prefix}search?phone_number=$query';
    }
  }

  String attachBankAccount(int walletId,int bankAccountId){
    return '$prefix$walletId/attach-bank-account/$bankAccountId';
  }

  String detachBankAccount(int walletId){
    return '$prefix$walletId/detach-bank-account';
  }
}