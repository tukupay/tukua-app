class SmsRequest {
  final List<String> phoneNumbers;
  final String message;
  final String? senderId;

  SmsRequest({
    required this.phoneNumbers,
    required this.message,
    this.senderId,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['phone_numbers'] = phoneNumbers;
    data['message'] = message;
    if (senderId != null) {
      data['sender_id'] = senderId;
  }
  return data;
  }
}
