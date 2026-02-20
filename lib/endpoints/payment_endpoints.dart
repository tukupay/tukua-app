import 'package:tuku/endpoints/endpoints.dart';

class Payment{
  static const route='/payments';

  String get prefix=>'${Configs.root}$route/';

  String get transactionTypes=>'${prefix}transaction-types';

  String get paymentMethods=>'${prefix}payment-methods';

  String get directPayment=>'${prefix}direct';

  String get validatePayment=>'${prefix}validate';

  String get bulkTransfer=>'${prefix}bulk-transfer';
}