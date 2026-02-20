import 'package:tuku/models/models.dart';

abstract class LocalUserRepository{
  Future<LocalUserModel> saveUser(UserModel user);

  Future<LocalUserModel> updateUser(UserModel user);

  Future<LocalUserModel?> getUser();

  Future<void> clearDatabase();
}