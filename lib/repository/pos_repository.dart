import 'package:tuku/models/models.dart';

abstract class PosRepository{
  Future<PosResponse> createProfile(PosRequest request);

  Future<PosResponse> getProfile();

  Future<PosResponse> updateProfile(PosRequest request);
}