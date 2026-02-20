import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

import '../repository/repository.dart';
import '../services/services.dart';

class SenderIdsProvider extends ChangeNotifier{

  List<String> _suggestedIds=[];
  List<String> get suggestedIds=>_suggestedIds;

  // requesting
  bool _requestingSenderId=false;
  bool get requestingSenderId=>_requestingSenderId;

  SenderIdResponse? _senderIdResponse;
  SenderIdResponse? get senderIdResponse=>_senderIdResponse;

  // fetching requests
  bool _loadingSenderIdRequests=false;
  bool get loadingSenderIdRequests=>_loadingSenderIdRequests;

  List<SenderIdResponse> _senderIdRequests=[];
  List<SenderIdResponse> get senderIdRequests=>_senderIdRequests;

  // fetching sender ids
  bool _loadingSenderIds=false;
  bool get loadingSenderIds=>_loadingSenderIds;

  UserSenderId? _senderIds;
  UserSenderId? get senderIds=>_senderIds;

  SenderIdsRepository api=SenderIdsService();

  void addSuggestedID(String id){
    _suggestedIds.add(id);
    notifyListeners();
  }

  void removeSuggestedID(String id){
    _suggestedIds.remove(id);
    notifyListeners();
  }

  Future<void> requestSenderId(SenderIdRequest request)async{
    _requestingSenderId=true;
    notifyListeners();
    _senderIdResponse=await api.requestSenderId(request);
    if(_senderIdResponse?.error!=null){
      Fluttertoast.showToast(msg: _senderIdResponse!.error!);
    }else{
      _senderIdRequests.add(_senderIdResponse!);
    }
    _requestingSenderId=false;
    notifyListeners();
  }

  Future<void> getSenderIdRequests()async{
    _loadingSenderIdRequests=true;
    notifyListeners();
   if(_senderIdRequests.isEmpty){
     _senderIdRequests=await api.getSenderIdRequests();
   }
    _loadingSenderIdRequests=false;
    notifyListeners();
  }

  Future<void> getSenderIds()async{
    _loadingSenderIds=true;
    notifyListeners();
    ProfileProvider? profile;
    if(getIt.isRegistered<ProfileProvider>()){
      profile=getIt<ProfileProvider>();
      await profile.getUser();
    }else{
      getIt.registerSingleton(ProfileProvider());
      profile=getIt<ProfileProvider>();
      await profile.getUser();
    }
    int? userId=profile.user?.userId;
    if(userId!=null && _senderIds==null){
      _senderIds=await api.senderIds(userId);
    }
    _loadingSenderIds=false;
    notifyListeners();
  }
}