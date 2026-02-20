class SmsQueueResponse {
  final bool? success;
  final String? message;
  final String? messageId;
  final int? recipientCount;
  final String? groupName;
  final DateTime? queuedAt;
  String? errors;

  SmsQueueResponse({
    this.success,
    this.message,
    this.messageId,
    this.recipientCount,
    this.groupName,
    this.queuedAt,
    this.errors
  });

  factory SmsQueueResponse.fromJson(Map<String, dynamic> json) {
    return SmsQueueResponse(
        success: json['success'],
        message: json['message'],
        messageId: json['message_id'],
        recipientCount: json['recipient_count'],
        groupName: json['group_name'],
        queuedAt:json['queued_at']!=null? DateTime.parse((json['queued_at'])):null,
        errors: json['errors']
    );
  }
}