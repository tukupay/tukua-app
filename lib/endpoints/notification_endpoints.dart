import 'package:tuku/endpoints/endpoints.dart';

class Notifications{
  static const route='/notifications';

  String get prefix=>'${Configs.root}$route/';

  String getNotifications(int offset,bool? unreadOnly){
    return '$prefix?limit=10&offset=$offset&unread_only=$unreadOnly';
  }

  String get stats=>'${prefix}stats';

  String markAsRead(int id){
    return '$prefix$id/read';
  }

  String get readAll=>'${prefix}read-all';

  String get preferences=>'${prefix}preferences';

  String updatePreference(String type){
    return '${prefix}preferences/type/$type';
  }
}