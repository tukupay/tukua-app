import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../models/models.dart';
import '../repository/repository.dart';
import '../services/services.dart';

class SmsProvider extends ChangeNotifier{
  // sending sms
  bool _sendingSms=false;
  bool get sendingSms=>_sendingSms;

  SmsResponse? _smsResponse;
  SmsResponse? get smsResponse=>_smsResponse;

  // outbox
  bool _loadingOutbox=false;
  bool get loadingOutbox=>_loadingOutbox;

  List<OutboxSms> _outbox=[];
  List<OutboxSms> get outbox=>_outbox;

  // stats
  bool _loadingStats=false;
  bool get loadingStats=>_loadingStats;

  SmsStats? _stats;
  SmsStats? get stats=>_stats;

  // send to group
  bool _sendingToGroup=false;
  bool get sendingToGroup=>_sendingToGroup;

  SmsResponse? _groupSmsResponse;
  SmsResponse? get groupSmsResponse=>_groupSmsResponse;

  // topup sms
  bool _toppingUpSms=false;
  bool get toppingUpSms=>_toppingUpSms;

  SmsTopUpResponse? _topUpResponse;
  SmsTopUpResponse? get topUpResponse=>_topUpResponse;

  // queue sms
  bool _queueingSms=false;
  bool get queueingSms=>_queueingSms;

  SmsQueueResponse? _queueResponse;
  SmsQueueResponse? get queueResponse=>_queueResponse;

  bool _queuingGroup=false;
  bool get queuingGroup=>_queuingGroup;

  SmsQueueResponse? _groupQueueResponse;
  SmsQueueResponse? get groupQueueResponse=>_groupQueueResponse;

  // get queue status
  bool _loadingQueueStatus=false;
  bool get loadingQueueStatus=>_loadingQueueStatus;

  SmsQueueStatus? _queueStatus;
  SmsQueueStatus? get queueStatus=>_queueStatus;


  SmsRepository api=SmsService();

  Future<void> sendSms(SmsRequest sms)async{
    _sendingSms=true;
    notifyListeners();
    _smsResponse=await api.sendSms(sms);
    if(_smsResponse?.error!=null){
      Fluttertoast.showToast(msg: _smsResponse!.error!);
    }
    _sendingSms=false;
    notifyListeners();
  }

  Future<void> getOutbox()async{
    _loadingOutbox=true;
    notifyListeners();
    _outbox=await api.getOutbox();
    _loadingOutbox=false;
    notifyListeners();
  }

  Future<void> getSmsStats()async{
    _loadingStats=true;
    notifyListeners();
    final resp=await api.getSmsStats();
    if(resp.errors!=null){
      Fluttertoast.showToast(msg: resp.errors!);
    }else{
      _stats=resp;
    }
    _loadingStats=false;
    notifyListeners();
  }

  Future<void> sendSmsToGroup(GroupSmsRequest sms)async {
    _sendingToGroup = true;
    notifyListeners();
    _groupSmsResponse = await api.sendSmsToGroup(sms);
    if(_groupSmsResponse?.error!=null){
      Fluttertoast.showToast(msg: _groupSmsResponse!.error!);
    }
    _sendingToGroup = false;
    notifyListeners();
  }

  Future<void> topUpSms(SmsTopUpRequest sms)async {
    _toppingUpSms = true;
    notifyListeners();
    _topUpResponse = await api.topUpSms(sms);
    _toppingUpSms = false;
    notifyListeners();
  }

  Future<void> queueBulkSms(SmsRequest sms)async {
    _queueingSms = true;
    notifyListeners();
    _queueResponse = await api.queueBulkSms(sms);
    _queueingSms = false;
    notifyListeners();
  }

  Future<void> queueGroupSms(GroupSmsRequest sms)async {
    _queuingGroup = true;
    notifyListeners();
    _groupQueueResponse = await api.queueGroupSms(sms);
    _queuingGroup = false;
    notifyListeners();
  }

  Future<void> getQueueStatus()async {
    _loadingQueueStatus = true;
    notifyListeners();
    _queueStatus = await api.getQueueStatus();
    _loadingQueueStatus = false;
    notifyListeners();
  }

}