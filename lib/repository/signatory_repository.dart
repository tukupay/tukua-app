import 'package:tuku/models/models.dart';

abstract class SignatoryRepository {
  Future<SignatoryResponse> inviteSignatory(int walletId, SignatoryRequest request);

  Future<String?> removeSignatory(int walletId);

  Future<SignatoryResponse> updateRole(int walletId, int signatoryId, String role);

  Future<SignatoryResponse> updateDetails(int walletId,int signatoryId, SignatoryRequest request);
}