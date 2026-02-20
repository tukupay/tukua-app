import 'package:tuku/endpoints/endpoints.dart';

class Fundraiser{
  static const route='/fundraising';

  String get prefix=>'${Configs.root}$route/';

  String get categories=>'${prefix}categories';

  String get statuses=>'${prefix}statuses';

  String get newCampaign=>'${prefix}campaigns';

  String myCampaigns(String? status){
    return '${prefix}campaigns?status_filter=$status';
  }

  String publicCampaigns(int offset){
    return '${prefix}public/campaigns?limit=10&offset=$offset';
  }

  String getCampaign(int campaignId){
    return '${prefix}campaigns/$campaignId';
  }

  String get availableWallets=>'${prefix}wallets/available';

  String contributions(int campaignId){
    return '${prefix}campaigns/$campaignId/contribute';
  }

  String myContributions(int campaignId){
    return '${prefix}campaigns/$campaignId/my-contributions';
  }

  String getPledges(int campaignId){
    return '${prefix}campaigns/$campaignId/pledges';
  }

  String pledge(int campaignId){
    return '${prefix}campaigns/$campaignId/pledge';
  }

  String editPledge(int pledgeId){
    return '${prefix}pledges/$pledgeId/edit';
  }

  String get myPledges=>'${prefix}pledges/my-pledges';

  String processPledgePayment(int pledgeId){
    return '${prefix}pledges/$pledgeId/payments';
  }

  String getCampaignAnalytics(int campaignId){
    return '${prefix}campaigns/$campaignId/analytics';
  }
}