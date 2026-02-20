import 'package:tuku/models/models.dart';

abstract class FundraiserRepository{
  Future<List<String>> getCategories();

  Future<FundraiserResponse> createFundraiser(FundraiserRequest request);

  Future<List<WalletSnippet>> getAvailableWallets();

  Future<List<String>> getFundraiserStatuses();

  Future<PaginatedFundraisersResponse> getAllFundraisers(int offset);

  Future<PaginatedFundraisersResponse> getMyFundraisers(String status);

  Future<FundraiserResponse> getFundraiser(int id);

  Future<FundraiserResponse> updateFundraiser(int id, Map<String,dynamic> updates);

  Future<ContributionResponse> contributeToCampaign(int fundraiserId, ContributionRequest request);

  Future<List<ContributionResponse>> getContributions(int fundraiserId);

  Future<List<ContributionResponse>> getMyContributions(int fundraiserId);

  Future<PledgeResponse> pledgeToCampaign(int fundraiserId, PledgeRequest request);

  Future<PledgeResponse> updatePledge(int pledgeId,double amount);

  Future<List<PledgeResponse>> getPledges(int fundraiserId);

  Future<List<PledgeResponse>> getMyPledges();

  Future<PledgePaymentResponse> processPledgePayment(int pledgeId,PledgePaymentRequest request);

  Future<FundraiserAnalytics> getCampaignAnalytics(int fundraiserId);

}