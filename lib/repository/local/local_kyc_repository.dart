import 'package:tuku/models/models.dart';

abstract class LocalKycRepository{

  Future<List<LocalKycModel>> saveKycs(List<KycModel> kycs);

  Future<List<LocalKycModel>> getKycs();

  Future<void> deleteKyc(int kycId);

  // INDIVIDUAL
  Future<LocalKycModel> saveFrontKyc(KycModel kyc);

  Future<LocalKycModel> saveBackKyc(KycModel kyc);

  Future<LocalKycModel> saveSelfieKyc(KycModel kyc);

  // BUSINESS
  Future<LocalKycModel> saveCertKyc(KycModel kyc);

  Future<LocalKycModel> saveKraKyc(KycModel kyc);

}