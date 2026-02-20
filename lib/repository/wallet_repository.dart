import 'package:tuku/models/models.dart';

abstract class WalletRepository{

  Future<List<WalletType>> getWalletTypes();

  Future<FullWallet> createWallet(WalletRequest wallet);

  Future<List<FullWallet>> listWallets(int userId);

  Future<FullWallet> getWallet(int walletId);

  Future<FullWallet> updateWallet(int walletId,Map<String,dynamic> updated);

  Future<String?> deleteWallet(int walletId);

  Future<String> setPrimaryWallet(int walletId);

  Future<WalletSearchResult> searchWallets(String query);

  Future<TransactionsResp> getWalletTransactions(int walletId,int offset,DateTime start, DateTime end);

  Future<FullWallet> attachBankAccount(int walletId,int bankId);

  Future<FullWallet> detachBankAccount(int walletId);
}