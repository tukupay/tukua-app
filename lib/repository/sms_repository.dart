import 'package:tuku/models/models.dart';
abstract class SmsRepository{
  Future<SmsResponse> sendSms(SmsRequest sms);

  Future<List<OutboxSms>> getOutbox();

  Future<SmsStats> getSmsStats();

  Future<SmsResponse> sendSmsToGroup(GroupSmsRequest sms);

  Future<SmsTopUpResponse> topUpSms(SmsTopUpRequest sms);

  Future<SmsQueueResponse> queueBulkSms(SmsRequest sms);

  Future<SmsQueueResponse> queueGroupSms(GroupSmsRequest sms);

  Future<SmsQueueStatus> getQueueStatus();
}