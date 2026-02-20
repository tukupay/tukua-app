import 'package:tuku/models/models.dart';

abstract class ProfileRepository{
  Future<UserModel> updateIndividualProfile(Map<String,String> updates);

  Future<UserModel> updateBusinessProfile(Map<String,String> updates);
}