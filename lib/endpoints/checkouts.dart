import 'package:tuku/endpoints/endpoints.dart';

class Checkouts{
  static const route='/checkout';

  String get prefix=>'${Configs.root}$route/';

  String get types=>'${prefix}types';

  String get links=>'${prefix}links';

}