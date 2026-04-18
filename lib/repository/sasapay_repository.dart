import 'package:tuku/models/models.dart';

abstract class SasaPayRepository {
  // CUSTOMER ONBOARDING
  Future<OnboardingInitResp> initializeCustomerOnboarding(CustomerInitRequest request);

  Future<String?> confirmCustomerDetails(String requestId,String otp);

  Future<String?> submitCustomerDocs();

  // BUSINESS ONBOARDING
  Future<OnboardingInitResp> initializeBusinessOnboarding(BusinessInitRequest request);

  Future<String?> confirmBusinessDetails(String requestId,String otp);

  Future<String?> submitBusinessDocs();

  // biz types
  Future<List<String>> getBusinessTypes();

  // countries
  Future<List<Country>> getCountries();

  // sub regions
  Future subRegions(String callingCode);

  // industries
  Future<List<Industry>> getIndustries();

  // sub industries
  Future subIndustries(int industryId);

  // bank code (existing banks array)


  // WALLET TYPES
  Future<List<SasaWalletType>> getWalletTypes();

  // CHANNEL CODES
  Future<List<ChannelCode>> getChannelCodes();
}