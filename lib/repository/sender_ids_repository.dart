import 'package:tuku/models/models.dart';

abstract class SenderIdsRepository{
  Future<SenderIdResponse> requestSenderId(SenderIdRequest request);

  Future<List<SenderIdResponse>> getSenderIdRequests();

  Future<UserSenderId> senderIds(int userId);
}