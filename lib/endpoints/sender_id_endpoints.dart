import 'endpoints.dart';

class SenderId{
  static const route='/sender-ids';

  String get prefix=>'${Configs.root}$route/';

  // https://test.api.tuku.money/api/v1/sender-ids/request
  String get request=>'${prefix}request';

  // https://test.api.tuku.money/api/v1/sender-ids/my-requests
  String get myRequests=>'${prefix}my-requests';

  // https://test.api.tuku.money/api/v1/sender-ids/user/{user_id}
  String userIds(int userId){
    return '${prefix}user/$userId';
  }


}