class UserSenderId {
  final List<ActualSenderId>? userSenderIds;
  final List<String>? systemSenderIds;
  final int? totalCount;
  String? error;

  UserSenderId({
    this.userSenderIds,
    this.systemSenderIds,
    this.totalCount,
    this.error
  });

  factory UserSenderId.fromJson(Map<String, dynamic> json) {
    var userSenderIdsFromJson = json['user_sender_ids'];
    List<ActualSenderId> parsedUserSenderIds = [];
    if (userSenderIdsFromJson is List) {
      parsedUserSenderIds = userSenderIdsFromJson
          .map((item) =>
          ActualSenderId.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    var systemIdsFromJson = json['system_sender_ids'];
    List<String> parsedSystemSenderIds = [];
    if (systemIdsFromJson is List) {
      parsedSystemSenderIds = systemIdsFromJson.map((item) => item.toString()).toList();
    }

    return UserSenderId(
      userSenderIds: parsedUserSenderIds,
      systemSenderIds: parsedSystemSenderIds,
      totalCount: json['total_count'],
      error: json['errors']
    );
  }
}


// Class for items in the "user_sender_ids" list
class ActualSenderId {
  final int id;
  final String senderId;
  final String? description;
  final String status;
  final DateTime createdAt;

  ActualSenderId({
    required this.id,
    required this.senderId,
    this.description,
    required this.status,
    required this.createdAt,
  });

  factory ActualSenderId.fromJson(Map<String, dynamic> json) {

    return ActualSenderId(
      id: json['id'],
      senderId: json['sender_id'],
      description: json['description'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

}


