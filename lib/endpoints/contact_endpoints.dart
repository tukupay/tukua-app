import 'package:tuku/endpoints/endpoints.dart';

class Contacts{
  static const route='/contacts';

  String get prefix=>'${Configs.root}$route';

  String get createGroup=>'$prefix/groups';

  String get allGroups=>'$prefix/groups';

  String getGroup(int groupId){
    return '$prefix/groups/$groupId';
  }

  String updateGroup(int groupId){
    return '$prefix/groups/$groupId';
  }

  String deleteGroup(int groupId){
    return '$prefix/groups/$groupId';
  }

  String get createContact=>prefix;

  String get allContacts=>prefix;

  String getContact(int contactId){
    return '$prefix/$contactId';
  }

  String updateContact(int contactId){
    return '$prefix/$contactId';
  }

  String deleteContact(int contactId){
    return '$prefix/$contactId';
  }

  String get favourites=>'$prefix/favourites';

  String get groupsContacts=>'$prefix/getcontacts';
}