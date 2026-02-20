import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import '../widgets/widget.dart';

class ContactsProvider extends ChangeNotifier{
  // create group
  bool _creatingGroup=false;
  bool get creatingGroup=>_creatingGroup;

  ContactGroupResponse? _createGroupResponse;
  ContactGroupResponse? get createGroupResponse=>_createGroupResponse;

  // list groups
  bool _loadingGroups=false;
  bool get loadingGroups=>_loadingGroups;

  List<ContactGroupResponse> _groups=[];
  List<ContactGroupResponse> get groups=>_groups;

  ContactGroupResponse? _selectedGroup;
  ContactGroupResponse? get selectedGroup=>_selectedGroup;

  // list group contacts
  bool _loadingGroupContacts=false;
  bool get loadingGroupContacts=>_loadingGroupContacts;

  FullGroup? _fullGroup;
  FullGroup? get fullGroup=>_fullGroup;

  // update group
  bool _updatingGroup=false;
  bool get updatingGroup=>_updatingGroup;

  ContactGroupResponse? _updateGroupResponse;
  ContactGroupResponse? get updateGroupResponse=>_updateGroupResponse;

  // delete group
  bool _deletingGroup=false;
  bool get deletingGroup=>_deletingGroup;

  String? _deleteGroupError;
  String? get deleteGroupError=>_deleteGroupError;

  // create contact
  bool _creatingContact=false;
  bool get creatingContact=>_creatingContact;

  ContactResponse? _createContactResponse;
  ContactResponse? get createContactResponse=>_createContactResponse;

  // get contacts
  bool _loadingContacts=false;
  bool get loadingContacts=>_loadingContacts;

  List<FullContact>? _contacts;
  List<FullContact>? get contacts=>_contacts;

  bool _loadingContact=false;
  bool get loadingContact=>_loadingContact;

  FullContact? _contact;
  FullContact? get contact=>_contact;

  // update contact
  bool _updatingContact=false;
  bool get updatingContact=>_updatingContact;

  ContactResponse? _updateContactResponse;
  ContactResponse? get updateContactResponse=>_updateContactResponse;

  // delete contact
  bool _deletingContact=false;
  bool get deletingContact=>_deletingContact;

  String? _deleteContactError;
  String? get deleteContactError=>_deleteContactError;

  // favourites
  bool _loadingFavourites=false;
  bool get loadingFavourites=>_loadingFavourites;

  List<FullContact> _favourites=[];
  List<FullContact> get favourites=>_favourites;

  bool _addingFavourite=false;
  bool get addingFavourite=>_addingFavourite;

  // groups contacts
  bool _loadingGroupsContacts=false;
  bool get loadingGroupsContacts=>_loadingGroupsContacts;

  List<String> _groupsContacts=[];
  List<String> get groupsContacts=>_groupsContacts;


  ContactsRepository api=ContactsService();

  // create a group
  Future<void> createContactGroup(ContactGroupRequest group)async{
    _creatingGroup=true;
    notifyListeners();
    _createGroupResponse=await api.createContactGroup(group);
    if(_createGroupResponse?.error!=null){
      Fluttertoast.showToast(msg: _createGroupResponse!.error!);
    }else{
      _groups.add(_createGroupResponse!);
    }
    _creatingGroup=false;
    notifyListeners();
  }

  // list groups
  Future<void> listContactGroups()async{
    _loadingGroups=true;
    notifyListeners();
    _groups=await api.listContactGroups();
    _loadingGroups=false;
    notifyListeners();
  }

  // select a group
  void selectGroup(ContactGroupResponse group){
    _selectedGroup=group;
    notifyListeners();
  }

  // list contacts of a group
  Future<void> listGroupContacts()async{
    int groupId=_selectedGroup!.id!;
    _loadingGroupContacts=true;
    notifyListeners();
    _fullGroup=await api.listGroupContacts(groupId);
    _loadingGroupContacts=false;
    notifyListeners();
  }

  void resetGroup(){
    _selectedGroup=null;
    _fullGroup=null;
    notifyListeners();
  }

  Future<void> updateContactGroup(int groupId,ContactGroupRequest group)async {
    _updatingGroup = true;
    notifyListeners();
    _updateGroupResponse = await api.updateContactGroup(groupId, group);
    _updatingGroup = false;
    notifyListeners();
  }

  Future<void> deleteContactGroup(int groupId)async{
    _deletingGroup=true;
    notifyListeners();
    _deleteGroupError=await api.deleteContactGroup(groupId);
    _deletingGroup=false;
    notifyListeners();
  }

  Future<void> createContact(ContactRequest contact,BuildContext context)async{
    _creatingContact=true;
    notifyListeners();
    // show dialog while uploading
    showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
      icon: HugeIcons.strokeRoundedUser,
      action: 'Adding Member',
    ));
    _createContactResponse=await api.createContact(contact);
    // pop dialog
    Navigator.pop(context);
    if(_createContactResponse?.error!=null){
      Fluttertoast.showToast(msg: _createContactResponse!.error!);
    }else{
      // if successful
      final resp=Contact(
          name: _createContactResponse!.name!,
          phone: _createContactResponse!.phone,
          id: _createContactResponse!.id!,
          groupId: _createContactResponse!.groupId!,
          createdAt: _createContactResponse!.createdAt!,
          updatedAt: _createContactResponse!.createdAt!);
      _fullGroup?.contacts?.add(resp);
      _selectedGroup?.contactCount=(_selectedGroup?.contactCount??0)+1;
      _fullGroup?.contactCount=(_fullGroup?.contactCount??0)+1;
      final fc=FullContact(
          name: _createContactResponse!.name!,
          phone: _createContactResponse!.phone,
          id: _createContactResponse!.id!,
          groupId: _createContactResponse!.groupId!,
          createdAt: _createContactResponse!.createdAt!,
          updatedAt: _createContactResponse!.createdAt!);
      _contacts?.add(fc);
      showGeneralDialog(
          context: context,
          pageBuilder: (context,anim1,anim2){
            return const SizedBox();
          },
          transitionDuration: const Duration(milliseconds: 400),
          transitionBuilder: (context,anim1,anim2,child){
            return SlideTransition(
                position: Tween(
                    begin: const Offset(1, 0),
                    end: const Offset(0, 0)
                ).animate(anim1),
                child: TopUpAlert(
                    title: 'Member Added Successfully.',
                    tapped: (){
                      Navigator.pop(context);
                      Navigator.pop(context);
                    }));
          }
      );
      notifyListeners();
    }
    _creatingContact=false;
    notifyListeners();
  }

  Future<void> getContacts()async{
    _loadingContacts=true;
    notifyListeners();
    if(_contacts==null||_contacts!.isEmpty){
      _contacts=await api.getContacts();
    }
    _loadingContacts=false;
    notifyListeners();
  }

  Future<void> getContact(int contactId)async{
    _loadingContact=true;
    notifyListeners();
    _contact=await api.getContact(contactId);
    _loadingContact=false;
    notifyListeners();
  }

  Future<void> updateContact(int contactId,ContactRequest contact)async {
    _updatingContact = true;
    notifyListeners();
    _updateContactResponse = await api.updateContact(contactId, contact);
    if(_updateContactResponse?.error!=null){
      Fluttertoast.showToast(msg: _updateContactResponse!.error!);
    }else{
      final fc=FullContact(
          name: _updateContactResponse?.name,
          phone: _updateContactResponse?.phone,
          id: _updateContactResponse?.id,
          groupId: _updateContactResponse?.groupId!,
          createdAt: _updateContactResponse?.createdAt!,
          updatedAt: _updateContactResponse?.createdAt!);
    }
    bool exists=_fullGroup?.contacts?.where((c)=>c.id==contactId).isNotEmpty??false;
    if(exists){
      _fullGroup!.contacts!.firstWhere((el)=>el.id==contactId)
           ..name=_updateContactResponse!.name!
           ..phone=_updateContactResponse?.phone;
    }
    _updatingContact = false;
    notifyListeners();
  }

  Future<void> deleteContact(int contactId)async{
    _deletingContact=true;
    notifyListeners();
    _deleteContactError=await api.deleteContact(contactId);
    if(_deleteContactError!=null){
      Fluttertoast.showToast(msg: _deleteContactError!);
    }else{
      _selectedGroup?.contactCount=(_selectedGroup?.contactCount??0)-1;
      _fullGroup?.contactCount=(_fullGroup?.contactCount??0)-1;
      _fullGroup?.contacts?.removeWhere((c)=>c.id==contactId);
      _contacts?.removeWhere((c)=>c.id==contactId);
      notifyListeners();
    }
    _deletingContact=false;
    notifyListeners();
  }

  Future<void> getFavourites()async{
    _loadingFavourites=true;
    notifyListeners();
    _favourites=await api.getFavourites();
    _loadingFavourites=false;
    notifyListeners();
  }

  Future<void> addFavourite(ContactRequest contact)async{
    _addingFavourite=true;
    notifyListeners();
    final resp=await api.addFavourite(contact);
    if(resp.error==null){
      final fc=FullContact(
          name: resp.name!,
          phone: resp.phone,
          id: resp.id!,
        email: resp.email,
        createdAt: resp.createdAt,
        updatedAt: resp.updatedAt
      );
      _favourites.add(fc);
    }else{
      Fluttertoast.showToast(msg: resp.error!);
    }
    _addingFavourite=false;
    notifyListeners();
  }

  Future<void> getGroupsContacts(List<int> groupIds)async{
    _loadingGroupsContacts=true;
    notifyListeners();
    _groupsContacts=await api.getGroupsContacts(groupIds);
    _loadingGroupsContacts=false;
    notifyListeners();
  }

  // Clear group contacts (called when unselecting groups or after successful send)
  void clearGroupsContacts(){
    _groupsContacts.clear();
    notifyListeners();
  }
}