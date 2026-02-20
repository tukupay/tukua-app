class GroupSmsRequest {
  final int groupId;
  final String message;
  final String? senderId;

  GroupSmsRequest({
    required this.groupId,
    required this.message,
    this.senderId,
  });

  factory GroupSmsRequest.fromJson(Map<String, dynamic> json) {
    return GroupSmsRequest(
      groupId: json['group_id'],
      message: json['message'],
      senderId: json['sender_id'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['group_id'] = groupId;
    data['message'] = message;
    if (senderId != null) {
      data['sender_id'] = senderId;
    }
    return data;
  }
}