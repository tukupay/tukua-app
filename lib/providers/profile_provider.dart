import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import '../repository/repository.dart';
import '../services/services.dart';

class ProfileProvider extends ChangeNotifier{

  File? _backId;
  File? get backId=>_backId;

  LocalUserModel? _user;
  LocalUserModel? get user=>_user;

  bool _updatingProfile=false;
  bool get updatingProfile=>_updatingProfile;


  Map<String,String> _updates={};
  Map<String,String> get updates=>_updates;

  UserModel? _updatedProfile;
  UserModel? get updatedProfile=>_updatedProfile;


  LocalUserRepository local=LocalUserService();
  AuthRepository authApi=AuthService();

  Future<void> getUser()async{
    _user ??= await local.getUser();
    debugPrint('==>PROFILE PROVIDER USER IS ${_user?.userId}<==');
    notifyListeners();
  }

  void setUser(LocalUserModel updated){
    _user=updated;
    notifyListeners();
  }

  Future<void> updateIndividualProfile()async{
    _updatingProfile=true;
    notifyListeners();
    _updatedProfile=await authApi.updateProfile(_user!.userId!,_updates);
    if(_updatedProfile?.error!=null){
      Fluttertoast.showToast(msg: _updatedProfile!.error!);
    }else{
      // update in memory vals
     final updated=await local.updateUser(_updatedProfile!);
      _user=updated;
      notifyListeners();
    }
    _updatingProfile=false;
    notifyListeners();
  }

  Future<void> updateBusinessProfile()async{
    _updatingProfile=true;
    notifyListeners();
    _updatedProfile=await authApi.updateProfile(_user!.userId!,_updates);
    if(_updatedProfile?.error!=null){
      Fluttertoast.showToast(msg: _updatedProfile!.error!);
    }else{
      // update in memory vals
      final updated=await local.updateUser(_updatedProfile!);
      _user=updated;
      notifyListeners();
    }
    _updatingProfile=false;
    notifyListeners();
  }


  void clearUser(){
    _user=null;
    debugPrint("USER ${_user?.username} IS NULLED BY PROFILE PROVIDER");
    notifyListeners();
  }

}