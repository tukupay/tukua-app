import 'package:tuku/endpoints/endpoints.dart';

class Kyc{
  static const route='/kyc';

  String get prefix=>'${Configs.root}$route/';

  String get uploadDoc=>prefix;

  String get listDocs=>prefix;

  String getDocument(int id){
    return '$prefix$id';
  }

  String applyAnalysis(int id){
    return '${prefix}confirm-analysis/$id';
  }

  String deleteDocument(int id){
    return '$prefix$id';
  }

}