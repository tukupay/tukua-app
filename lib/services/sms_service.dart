import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';
class SmsService implements SmsRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<SmsResponse> sendSms(SmsRequest sms)async{
    final resp=await _http.post(Uri.parse(Sms().sendSms), body: json.encode(sms.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("SEND SMS SAYS $jsonData");
    final result=SmsResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<OutboxSms>> getOutbox()async{
    final resp=await _http.get(Uri.parse(Sms().outbox));
    List<OutboxSms> outbox=[];
    final data=resp.body;
    final jsonData=json.decode(data);
    final records=jsonData['sms_records'];
    debugPrint("GET OUTBOX SAYS $jsonData");
    if(records is List){
      for (dynamic r in records){
        final result=OutboxSms.fromJson(r);
        outbox.add(result);
      }
    }
    return outbox;
  }

  @override
  Future<SmsStats> getSmsStats()async{
    final resp=await _http.get(Uri.parse(Sms().smsStats));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET SMS STATS SAYS $jsonData");
    final result=SmsStats.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsResponse> sendSmsToGroup(GroupSmsRequest sms)async{
    final resp=await _http.post(Uri.parse(Sms().sendSmsToGroup), body: json.encode(sms.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("SEND SMS TO GROUP SAYS $jsonData");
    final result=SmsResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsTopUpResponse> topUpSms(SmsTopUpRequest sms)async{
    final resp=await _http.post(Uri.parse(Sms().topUpCredits), body: json.encode(sms.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("TOP UP SMS SAYS $jsonData");
    final result=SmsTopUpResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsQueueResponse> queueBulkSms(SmsRequest sms)async{
    final resp=await _http.post(Uri.parse(Sms().bulkSmsQueue), body: json.encode(sms.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("QUEUE BULK SMS SAYS $jsonData");
    final result=SmsQueueResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsQueueResponse> queueGroupSms(GroupSmsRequest sms)async{
    final resp=await _http.post(Uri.parse(Sms().bulkSmsGroupQueue), body: json.encode(sms.toJson()));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("QUEUE GROUP SMS SAYS $jsonData");
    final result=SmsQueueResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<SmsQueueStatus> getQueueStatus()async{
    final resp=await _http.get(Uri.parse(Sms().bulkSmsQueueStatus));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET QUEUE STATUS SAYS $jsonData");
    final result=SmsQueueStatus.fromJson(jsonData);
    return result;
  }
}