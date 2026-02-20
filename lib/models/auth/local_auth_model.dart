import 'package:isar/isar.dart';

part 'local_auth_model.g.dart';

@Collection()
class LocalAuthModel {
  Id id = Isar.autoIncrement;
  String? accessToken;
  String? refreshToken;
  String? phrase;
}
