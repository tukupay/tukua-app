import 'endpoints.dart';

class Signatories {
  static const route='/wallets';

  String get prefix=>'${Configs.root}$route/';


  String invite(int walletId){
    return '$prefix$walletId/invite';
  }

  String remove(int walletId){
    return '$prefix$walletId/remove';
  }

  String updateRole(int walletId,int signatoryId){
    return '$prefix$walletId/signatory/$signatoryId';
  }

  String updateContact(int walletId,int signatoryId){
    return '$prefix$walletId/signatories/$signatoryId/details';
  }
}