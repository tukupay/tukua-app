import '../models/models.dart';
abstract class CreditsRepository{
  Future<CreditBalance> getCreditBalance();

  Future<CreditTierPricing> getCreditPricing(int smsCount);

  Future<SmsTransactionHistory> getTransactionHistory();

}