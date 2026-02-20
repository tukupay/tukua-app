import 'package:tuku/endpoints/endpoints.dart';

class Profile{
  static const route='/profile';

  String get prefix=>'${Configs.root}/profile/';

  String get individual=>'${prefix}individual';

  String get business=>'${prefix}business';
}