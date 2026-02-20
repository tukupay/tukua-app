import 'package:tuku/endpoints/endpoints.dart';

class Sms{
  static const route='/sms';

  String get prefix=>'${Configs.root}$route/';

  String get sendSms=>prefix;

  String get outbox=>'${prefix}outbox';

  String get smsStats=>'${prefix}my-sms-stats';

  String get sendSmsToGroup=>'${prefix}group';

  String get topUpCredits=>'${prefix}topup';

  String get bulkSmsQueue=>'${prefix}queue/bulk';

  String get bulkSmsGroupQueue=>'${prefix}queue/group';

  String get bulkSmsQueueStatus=>'${prefix}queue/status';
}