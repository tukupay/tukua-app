import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/services/services.dart';
import 'package:tuku/repository/repository.dart';

class SignatoryProvider extends ChangeNotifier{

  SignatoryRepository signatoryApi=SignatoryService();

  // === Pending Requests State ===

  // Fetch dummy pending requests from model
  List<Map<String, dynamic>> get pendingRequests =>
      dummyPendingRequests.map((r) => r.toMap()).toList();

  // Fetch dummy invitations from model
  List<Map<String, dynamic>> get pendingInvitations =>
      dummyPendingInvitations.map((i) => i.toMap()).toList();

  // Fetch dummy history from model
  List<Map<String, dynamic>> get history =>
      dummySignatoryHistory.map((h) => h.toMap()).toList();

  /// Total pending requests count (for home banner)
  int get pendingRequestsCount => dummyPendingRequests.length + dummyPendingInvitations.length;

  // === Selected Request State (for navigation to SignatoryInfo) ===
  Map<String, dynamic>? _selectedRequest;
  Map<String, dynamic>? get selectedRequest => _selectedRequest;

  bool _isSelectedHistory = false;
  bool get isSelectedHistory => _isSelectedHistory;

  String? _selectedHistoryStatus;
  String? get selectedHistoryStatus => _selectedHistoryStatus;

  /// Select a signatory request for viewing details
  void selectRequest(Map<String, dynamic>? request, {bool isHistory = false, String? historyStatus}) {
    _selectedRequest = request;
    _isSelectedHistory = isHistory;
    _selectedHistoryStatus = historyStatus;
    notifyListeners();
  }

  // Invite state
  bool _inviting=false;
  bool get inviting=>_inviting;

  SignatoryResponse? _inviteResponse;
  SignatoryResponse? get inviteResponse=>_inviteResponse;

  // Remove state
  bool _removing=false;
  bool get removing=>_removing;

  String? _removeError;
  String? get removeError=>_removeError;

  bool _removeSuccess=false;
  bool get removeSuccess=>_removeSuccess;

  // Update state
  bool _updating=false;
  bool get updating=>_updating;

  SignatoryResponse? _updateResponse;
  SignatoryResponse? get updateResponse=>_updateResponse;

  /// Invite a new signatory to wallet
  Future<void> inviteSignatory(int walletId,SignatoryRequest request)async{
    _inviting=true;
    _inviteResponse=null;
    notifyListeners();
    _inviteResponse=await signatoryApi.inviteSignatory(walletId, request);
    if(_inviteResponse?.error!=null){
      Fluttertoast.showToast(msg: _inviteResponse!.error!);
    }
    _inviting=false;
    notifyListeners();
  }

  /// Remove signatory from wallet
  Future<void> removeSignatory(int walletId)async{
    _removing=true;
    _removeError=null;
    _removeSuccess=false;
    notifyListeners();
    final message=await signatoryApi.removeSignatory(walletId);
    if(message!=null){
      _removeError=message;
      Fluttertoast.showToast(msg: message);
    }else{
      _removeSuccess=true;
    }
    _removing=false;
    notifyListeners();
  }

  /// Update signatory role
  Future<void> updateRole(int walletId, int signatoryId, String role)async{
    _updating=true;
    _updateResponse=null;
    notifyListeners();
    _updateResponse=await signatoryApi.updateRole(walletId, signatoryId, role);
    if(_updateResponse?.error!=null){
      Fluttertoast.showToast(msg: _updateResponse!.error!);
    }
    _updating=false;
    notifyListeners();
  }

  /// Update signatory contact details
  Future<void> updateDetails(int walletId, int signatoryId, SignatoryRequest request)async{
    _updating=true;
    _updateResponse=null;
    notifyListeners();
    _updateResponse=await signatoryApi.updateDetails(walletId, signatoryId, request);
    if(_updateResponse?.error!=null){
      Fluttertoast.showToast(msg: _updateResponse!.error!);
    }
    _updating=false;
    notifyListeners();
  }

  /// Reset all states
  void reset(){
    _selectedRequest = null;
    _isSelectedHistory = false;
    _selectedHistoryStatus = null;
    _inviting=false;
    _inviteResponse=null;
    _removing=false;
    _removeError=null;
    _removeSuccess=false;
    _updating=false;
    _updateResponse=null;
    notifyListeners();
  }

}