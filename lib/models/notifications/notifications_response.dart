class NotificationsResponse {
  final List<NotificationModel>? notifications;
  final int? total;
  final int? size;
  final int? page;
  final bool? hasMore;
  final String? error;

  NotificationsResponse({
    this.notifications,
    this.total,
    this.size,
    this.page,
    this.hasMore,
    this.error,
  });

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) {
    var list = json['notifications'] as List?;
    List<NotificationModel>? notificationsList;
    if (list != null) {
      notificationsList = list.map((i) => NotificationModel.fromJson(i)).toList();
    }

    return NotificationsResponse(
      notifications: notificationsList,
      total: json['total'],
      size: json['size'],
      page: json['page'],
      hasMore: json['has_more'],
      error: json['errors'],
    );
  }
}

class NotificationModel {
  final int? id;
  final int? userId;
  final String? type;
  final String? category;
  final String? title;
  final String? message;
  final Map<String, dynamic>? data;
  final String? priority;
  String? status;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final DateTime? readAt;
  final DateTime? sentAt;
  final DateTime? deliveredAt;
  final bool? emailSent;
  final bool? smsSent;
  final bool? pushSent;
  final bool? inAppSent;
  final int? retryCount;
  final int? maxRetries;

  NotificationModel({
    this.id,
    this.userId,
    this.type,
    this.category,
    this.title,
    this.message,
    this.data,
    this.priority,
    this.status,
    this.createdAt,
    this.expiresAt,
    this.readAt,
    this.sentAt,
    this.deliveredAt,
    this.emailSent,
    this.smsSent,
    this.pushSent,
    this.inAppSent,
    this.retryCount,
    this.maxRetries,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      userId: json['user_id'],
      type: json['type'],
      category: json['category'],
      title: json['title'],
      message: json['message'],
      data: json['data'] as Map<String, dynamic>?,
      priority: json['priority'],
      status: json['status'],
      createdAt:
          json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      expiresAt:
          json['expires_at'] != null ? DateTime.parse(json['expires_at']) : null,
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at']) : null,
      sentAt: json['sent_at'] != null ? DateTime.parse(json['sent_at']) : null,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'])
          : null,
      emailSent: json['email_sent'],
      smsSent: json['sms_sent'],
      pushSent: json['push_sent'],
      inAppSent: json['in_app_sent'],
      retryCount: json['retry_count'],
      maxRetries: json['max_retries'],
    );
  }
}
