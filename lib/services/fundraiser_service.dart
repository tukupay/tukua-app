import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import 'package:http/http.dart' as http;
import '../endpoints/endpoints.dart';
import 'package:http_parser/http_parser.dart';

import 'auth_http.dart';
class FundraiserService implements FundraiserRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<List<String>> getCategories()async{
    final resp = await _http.get(Uri.parse(Fundraiser().categories));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET CATEGORIES SAYS $jsonData");
    List<String> categories=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        categories.add(json as String);
      }
    }
    return categories;
  }

  @override
  Future<FundraiserResponse> createFundraiser(FundraiserRequest request)async{
    final token = await _http.token();
    final uri=Uri.parse(Fundraiser().newCampaign);
    final req=http.MultipartRequest('POST', uri);
    req.fields['title'] = request.title;
    req.fields['category'] = request.category;
    req.fields['description'] = request.description;
    req.fields['goal_amount'] = request.goalAmount.toString();
    req.fields['start_date'] = request.startDate.toIso8601String();
    req.fields['end_date'] = request.endDate.toIso8601String();
    req.fields['wallet_id'] = request.walletId.toString();
    req.fields['analytics_public'] = request.analyticsPublic.toString();
    req.fields['is_public']=request.isPublic.toString();
    req.fields['allow_pledges']=request.allowPledges.toString();

    // Add cover photo file
    req.files.add(await http.MultipartFile.fromPath(
      'cover_photo',
      request.coverPhoto.path,
      contentType: MediaType(Strings.imageType, Strings.imageExt),
    ));

    // Add other images files
    if (request.otherImages != null) {
      for (var file in request.otherImages!) {
        req.files.add(await http.MultipartFile.fromPath(
          'other_images', // API field name for array
          file.path,
          contentType: MediaType(Strings.imageType, Strings.imageExt),
        ));
      }
    }
    if(token!=null){
      req.headers.addAll({'Authorization':'Bearer $token'});
    }
    final resp=await req.send();
    String respBody=await resp.stream.bytesToString();
    debugPrint("CREATE FUNDRAISER SAYS $respBody");
    final jsonData=json.decode(respBody);
    final result=FundraiserResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<WalletSnippet>> getAvailableWallets()async{
    final resp = await _http.get(Uri.parse(Fundraiser().availableWallets));
    final data=resp.body;
    final jsonData=json.decode(data)['wallets'];
    debugPrint("GET AVAILABLE WALLETS SAYS $jsonData");
    List<WalletSnippet> wallets=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        final wallet=WalletSnippet.fromJson(json);
        wallets.add(wallet);
      }
    }
    return wallets;
  }

  @override
  Future<List<String>> getFundraiserStatuses()async {
    final resp = await _http.get(Uri.parse(Fundraiser().statuses));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET FUNDRAISER STATUSES SAYS $jsonData");
    List<String> statuses = [];
    if (jsonData is List) {
      for (dynamic json in jsonData) {
        statuses.add(json as String);
      }
    }
    return statuses;
  }

  @override
  Future<PaginatedFundraisersResponse> getMyFundraisers(String status)async{
    final resp = await _http.get(Uri.parse(Fundraiser().myCampaigns(status)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET MY $status FUNDRAISERS SAYS $jsonData");
    final paginated=PaginatedFundraisersResponse.fromJson(jsonData);
    return paginated;
  }

  @override
  Future<PaginatedFundraisersResponse> getAllFundraisers(int offset)async{
    final resp = await _http.get(Uri.parse(Fundraiser().publicCampaigns(offset)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET ALL FUNDRAISERS SAYS $jsonData");
    final paginated=PaginatedFundraisersResponse.fromJson(jsonData);
    return paginated;
  }


  @override
  Future<FundraiserResponse> getFundraiser(int id)async{
    final resp = await _http.get(Uri.parse(Fundraiser().getCampaign(id)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET FUNDRAISER SAYS $jsonData");
    final result=FundraiserResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<FundraiserResponse> updateFundraiser(int id, Map<String,dynamic> updates) async{
    final token = await _http.token();
    final uri=Uri.parse(Fundraiser().getCampaign(id));
    final req=http.MultipartRequest('PATCH', uri);
    for (String key in updates.keys){
      req.fields[key]=updates[key];
    }
    if(token!=null){
      req.headers.addAll({'Authorization':'Bearer $token'});
    }
    final resp=await req.send();
    String respBody=await resp.stream.bytesToString();
    debugPrint("UPDATE FUNDRAISER SAYS $respBody");
    final jsonData=json.decode(respBody);
    final result=FundraiserResponse.fromJson(jsonData);
    return result;
  }



  @override
  Future<ContributionResponse> contributeToCampaign(int fundraiserId, ContributionRequest request)async{
    final resp = await _http.post(Uri.parse(Fundraiser().contributions(fundraiserId)), body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("CONTRIBUTE TO FUNDRAISER SAYS $jsonData");
    final result=ContributionResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<ContributionResponse>> getContributions(int fundraiserId)async{
    final resp = await _http.get(Uri.parse(Fundraiser().getPledges(fundraiserId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET FUNDRAISER CONTRIBUTIONS SAYS $jsonData");
    List<ContributionResponse> contributions=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=ContributionResponse.fromJson(json);
        contributions.add(result);
      }
    }
    return contributions;
  }

  @override
  Future<List<ContributionResponse>> getMyContributions(int fundraiserId)async{
    final resp = await _http.get(Uri.parse(Fundraiser().myContributions(fundraiserId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET MY CONTRIBUTIONS SAYS $jsonData");
    List<ContributionResponse> contributions=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=ContributionResponse.fromJson(json);
        contributions.add(result);
      }
    }
    return contributions;
  }

  @override
  Future<PledgeResponse> pledgeToCampaign(int fundraiserId, PledgeRequest request)async{
    final resp = await _http.post(Uri.parse(Fundraiser().pledge(fundraiserId)), body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("PLEDGE TO FUNDRAISER SAYS $jsonData");
    final result=PledgeResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<PledgeResponse> updatePledge(int pledgeId, double amount)async{
    final resp = await _http.patch(Uri.parse(Fundraiser().editPledge(pledgeId)), body: json.encode({"amount": amount}));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("UPDATE PLEDGE SAYS $jsonData");
    final result=PledgeResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<PledgeResponse>> getPledges(int fundraiserId)async{
    final resp = await _http.get(Uri.parse(Fundraiser().getPledges(fundraiserId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET FUNDRAISER PLEDGES SAYS $jsonData");
    List<PledgeResponse> pledges=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=PledgeResponse.fromJson(json);
        pledges.add(result);
      }
    }
    return pledges;
  }

  @override
  Future<List<PledgeResponse>> getMyPledges()async{
    final resp = await _http.get(Uri.parse(Fundraiser().myPledges));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET MY PLEDGES SAYS $jsonData");
    List<PledgeResponse> pledges=[];
    if(jsonData is List){
      for (dynamic json in jsonData){
        final result=PledgeResponse.fromJson(json);
        pledges.add(result);
      }
    }
    return pledges;
  }

  @override
  Future<PledgePaymentResponse> processPledgePayment(int pledgeId,PledgePaymentRequest request)async{
    final resp = await _http.post(Uri.parse(Fundraiser().processPledgePayment(pledgeId)), body: json.encode(request.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("PROCESS PLEDGE PAYMENT SAYS $jsonData");
    final result=PledgePaymentResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<FundraiserAnalytics> getCampaignAnalytics(int fundraiserId)async{
    final resp = await _http.get(Uri.parse(Fundraiser().getCampaignAnalytics(fundraiserId)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET CAMPAIGN ANALYTICS SAYS $jsonData");
    final result=FundraiserAnalytics.fromJson(jsonData);
    return result;
  }

}