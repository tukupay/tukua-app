import 'package:tuku/models/models.dart';

abstract class BankingRepository{
  Future<List<AvailableBank>> availableBanks();

  Future<FullBank> createBankAccount(BankRequest bankAcc);

  Future<List<FullBank>> getAccountsForWallet(int walletId);

  Future<List<FullBank>> getMyBankAccounts();

  Future<FullBank> getBankAccount(int id);

  Future<FullBank> toggleFavourite(int id);

  Future<FavBanksResponse> getFavourites();
}