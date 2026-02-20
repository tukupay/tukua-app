import 'package:flutter/foundation.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import '../services/services.dart';
import '../repository/repository.dart';

class BulkSmsProvider extends ChangeNotifier{
  String? _selectedSenderId;
  String? get selectedSenderId=>_selectedSenderId;

  bool _includePaymentLink=false;
  bool get includePaymentLink=>_includePaymentLink;

  int? _selectedQuickAmount;
  int? get selectedQuickAmount=>_selectedQuickAmount;

  List<DeviceContact> _selectedContacts=[];
  List<DeviceContact> get selectedContacts=>_selectedContacts;

  List<ContactGroupResponse> _selectedGroups=[];
  List<ContactGroupResponse> get selectedGroups=>_selectedGroups;

  int? _selectedGroupId;
  int? get selectedGroupId=>_selectedGroupId;

  FullGroup? _selectedGroup;
  FullGroup? get selectedGroup=>_selectedGroup;

  int _recipientCount=0;
  int get recipientCount=>_recipientCount;

  bool _loadingGroupContacts=false;
  bool get loadingGroupContacts=>_loadingGroupContacts;

  SmsRequest? _newSms;
  SmsRequest? get newSms=>_newSms;

  PaymentMethod? _selectedTopUpMethod;
  PaymentMethod? get selectedTopUpMethod=>_selectedTopUpMethod;

  FullWallet? _selectedWallet;
  FullWallet? get selectedWallet=>_selectedWallet;

  double _amount=0;
  double get amount=>_amount;

  // Store phone numbers from selected groups (for local SMS)
  List<String> _groupPhoneNumbers=[];
  List<String> get groupPhoneNumbers=>_groupPhoneNumbers;

  ContactsRepository api=ContactsService();

  void selectSenderId(String senderId){
    if(_selectedSenderId==senderId){
      _selectedSenderId=null;
    }else{
      _selectedSenderId=senderId;
    }
    notifyListeners();
  }

  void updateIncludePaymentLink(bool val){
    _includePaymentLink=val;
    notifyListeners();
  }

  void setWallet(FullWallet wallet){
    _selectedWallet=wallet;
    notifyListeners();
  }

  void setAmount(double val){
    _amount=val;
    notifyListeners();
  }

  void resetWallet(){
    _selectedWallet=null;
    _amount=0;
    notifyListeners();
  }

  // Set phone numbers from selected groups
  void setGroupPhoneNumbers(List<String> phoneNumbers){
    _groupPhoneNumbers=phoneNumbers;
    notifyListeners();
  }

  void setNewSms(SmsRequest sms){
    _newSms=sms;
    _recipientCount=0;

    // Count contacts
    if(_selectedContacts.isNotEmpty){
      _recipientCount+=_selectedContacts.length;
    }

    // Count groups
    if(_selectedGroups.isNotEmpty){
      for(ContactGroupResponse g in _selectedGroups){
        _recipientCount+=g.contactCount??0;
      }
    }

    notifyListeners();
  }

  void resetRecipientCount(){
    _recipientCount=0;
    notifyListeners();
  }

  void selectContact(DeviceContact contact){
    if(_selectedContacts.contains(contact)){
      _selectedContacts.remove(contact);
    }else{
      _selectedContacts.add(contact);
    }
    notifyListeners();
  }

  void selectGroup(ContactGroupResponse group){
    if(_selectedGroups.contains(group)){
      _selectedGroups.remove(group);
      // Clear group phone numbers if no groups selected
      if(_selectedGroups.isEmpty){
        _groupPhoneNumbers.clear();
      }
    }else{
      _selectedGroups.add(group);
    }
    notifyListeners();
  }

  void browseGroup(int groupId){
    _selectedGroupId=groupId;
    notifyListeners();
  }

  Future<void> listGroupContacts()async{
    _loadingGroupContacts=true;
    notifyListeners();
    _selectedGroup=await api.listGroupContacts(_selectedGroupId!);
    if(_selectedGroup?.error!=null){
      Fluttertoast.showToast(msg: _selectedGroup?.error??"API Error");
    }
    _loadingGroupContacts=false;
    notifyListeners();
  }

  void resetGroup(){
    _selectedGroupId=null;
    _selectedGroup=null;
    notifyListeners();
  }

  void resetRecipients(){
    _selectedGroups.clear();
    _selectedContacts.clear();
    _groupPhoneNumbers.clear();
    _recipientCount=0;
  }

  // for top up
  void selectQuickAmount(int amount){
    if(_selectedQuickAmount==amount){
      _selectedQuickAmount=null;
    }else{
      _selectedQuickAmount=amount;
    }
    notifyListeners();
  }

  void selectTopUpMethod(PaymentMethod method){
    _selectedTopUpMethod=method;
    notifyListeners();
  }
}
List<int> quickAmounts=[100,200,500,1000,10000];