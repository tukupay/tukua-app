import 'package:tuku/endpoints/endpoints.dart';

class Credit{
  static const route='/sms-credits';

  String get prefix=>'${Configs.root}$route/';

  String get balance=>'${prefix}balance';

  String get pricing=>'${prefix}pricing';

  String get transactions=>'${prefix}transactions';
}