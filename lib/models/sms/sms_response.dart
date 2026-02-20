class SmsResponse {
  final bool? success;
  final String? message;
  final String? messageId;
  final int? recipientCount;
  final String? groupName;
  final String? queuedAt;
  String? error;

  SmsResponse({
    this.success,
    this.message,
    this.messageId,
    this.recipientCount,
    this.groupName,
    this.queuedAt,
    this.error,
  });

  factory SmsResponse.fromJson(Map<String, dynamic> json) {
    return SmsResponse(
      success: json['success'],
      message: json['message'],
      messageId: json['message_id'],
      recipientCount: json['recipient_count'],
      groupName: json['group_name'],
      queuedAt: json['queued_at'],
      error: json['errors'],
    );
  }
}
