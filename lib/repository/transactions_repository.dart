import 'package:tuku/models/models.dart';

abstract class TransactionsRepository{
  Future<TransactionSummaryResp> getMySummary();

  Future<TransactionsResp> getMyTransactions(int offset,DateTime start,DateTime end);

  Future<TransactionsResp> getPosRecents(DateTime start,DateTime end);

  Future<TransactionsResp> getPosTransactions(int offset,DateTime start,DateTime end);

  Future<BulkTransactions> getBulkTransactions(int offset,DateTime start,DateTime end);
}