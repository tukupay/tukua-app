import 'endpoints.dart';

class SasaPay {
  static const route='/sasapay';

  String get prefix=>'${Configs.root}$route/';

  // customer onboarding

  String get customerInitial=>'${prefix}onboard/customer/initial';

  String get customerConfirm=>'${prefix}onboard/customer/confirm';

  String get customerDocs=>'${prefix}onboard/customer/kyc';

  // business onboarding
  String get businessInitial=>'${prefix}onboard/business/initial';

  String get businessConfirm=>'${prefix}onboard/business/confirm';

  String get businessDocs=>'${prefix}onboard/business/kyc';

  // wallet types
  String get walletTypes=>'${prefix}wallet-types-info';

  //  biz types
  String get businessTypes=>'${prefix}business-types';

  //   // countries
  String get countries=>'${prefix}countries';

  //   // sub regions
  String subRegions(String callingCode)=>'${prefix}sub-regions?country_code=$callingCode';

  //   // industries
  String get industries=>'${prefix}industries';

  //   // sub industries
  String subIndustries(int industryId)=>'${prefix}sub-industries?industry_id=$industryId';

  // channel codes
  String get channelCodes=>'${prefix}channel-codes/mobile';
}