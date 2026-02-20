import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/utils/date_formatter.dart';

class TransactionsEndpoints{
  static const route='/transactions';

  String get prefix=>'${Configs.root}$route/';


  String myTransactions (int offset,DateTime start,DateTime end){
    // Format dates as yyyy-MM-dd so the query doesn't include time components
    final s = DateFormatter.formatYMD(start);
    final e = DateFormatter.formatYMD(end);
    return '${prefix}my-transactions?limit=15&offset=$offset&start_date=$s&end_date=$e';
  }

  String walletTransactions (int walletId, int offset,DateTime start,DateTime end){
    // Format dates as yyyy-MM-dd so the query doesn't include time components
    final s = DateFormatter.formatYMD(start);
    final e = DateFormatter.formatYMD(end);
    return '${prefix}my-transactions?wallet_id=$walletId&limit=15&offset=$offset&start_date=$s&end_date=$e';
  }

  String get mySummary=>'${prefix}my-summary';

  String posTransactions(int offset,DateTime start,DateTime end){
    // Format dates as yyyy-MM-dd so the query doesn't include time components
    final s = DateFormatter.formatYMD(start);
    final e = DateFormatter.formatYMD(end);
    return '${prefix}my-transactions?limit=15&offset=$offset&transaction_type=stk_pos&start_date=$s&end_date=$e';
  }

  String bulkTransactions(int offset,DateTime start,DateTime end){
    return '${prefix}bulk-transactions?limit=15&offset=$offset&start_date=$start&end_date=$end';
  }
}