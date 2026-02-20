import 'package:tuku/models/models.dart';

abstract class ContactsRepository{
  Future<ContactGroupResponse> createContactGroup(ContactGroupRequest group);

  Future<List<ContactGroupResponse>> listContactGroups();

  Future<FullGroup> listGroupContacts(int groupId);

  Future<ContactGroupResponse> updateContactGroup(int groupId,ContactGroupRequest group);

  Future<String?> deleteContactGroup(int groupId);

  Future<ContactResponse> createContact(ContactRequest contact);

  Future<List<FullContact>> getContacts();

  Future<FullContact> getContact(int contactId);

  Future<ContactResponse> updateContact(int contactId,ContactRequest contact);

  Future<String?> deleteContact(int contactId);

  Future<ContactResponse> addFavourite(ContactRequest contact);

  Future<List<FullContact>> getFavourites();

  Future<List<String>> getGroupsContacts(List<int> groupIds);

}