// /home/codeninja/Documents/dart/tuku/lib/models/sms/sms_queue_status.dart

import 'dart:convert';

class SmsQueueStatus {
  final String? queueUrl;
  final int? approximateNumberOfMessages;
  final int? approximateNumberOfMessagesNotVisible;
  final int? approximateNumberOfMessagesDelayed;
  final DateTime? createdTimestamp;
  final DateTime? lastModifiedTimestamp;
  final int? visibilityTimeout;
  final int? messageRetentionPeriod;
  final int? maximumMessageSize;
  final int? delaySeconds;
  String? error;

  SmsQueueStatus({
    this.queueUrl,
    this.approximateNumberOfMessages,
    this.approximateNumberOfMessagesNotVisible,
    this.approximateNumberOfMessagesDelayed,
    this.createdTimestamp,
    this.lastModifiedTimestamp,
    this.visibilityTimeout,
    this.messageRetentionPeriod,
    this.maximumMessageSize,
    this.delaySeconds,
    this.error
  });

  factory SmsQueueStatus.fromJson(Map<String, dynamic> json) {
    return SmsQueueStatus(
      queueUrl: json['queue_url'],
      approximateNumberOfMessages: json['approximate_number_of_messages'],
      approximateNumberOfMessagesNotVisible: json['approximate_number_of_messages_not_visible'],
      approximateNumberOfMessagesDelayed: json['approximate_number_of_messages_delayed'],
      createdTimestamp: json['created_timestamp']!=null? DateTime.parse(json['created_timestamp']):null,
      lastModifiedTimestamp:json['last_modified_timestamp']!=null?DateTime.parse(json['last_modified_timestamp']):null,
      visibilityTimeout: json['visibility_timeout'],
      messageRetentionPeriod: json['message_retention_period'],
      maximumMessageSize: json['maximum_message_size'],
      delaySeconds: json['delay_seconds'],
      error: json['errors']
    );
  }
}

