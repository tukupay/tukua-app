import 'package:tuku/models/models.dart';

class NotificationStats{
  final int? totalNotifications;
  int? unreadCount;
  final int? highPriorityCount;
  final int? mediumPriorityCount;
  final int? lowPriorityCount;
  final List<NotificationModel>? recentNotifications;
  final String? error;

  NotificationStats({
    this.totalNotifications,
    this.unreadCount,
    this.highPriorityCount,
    this.mediumPriorityCount,
    this.lowPriorityCount,
    this.recentNotifications,
    this.error,
  });

  factory NotificationStats.fromJson(Map<String, dynamic> json) {
    var list = json['recent_notifications'] as List?;
    List<NotificationModel>? notificationsList;
    if (list != null) {
      notificationsList = list.map((i) => NotificationModel.fromJson(i)).toList();
    }

    return NotificationStats(
      totalNotifications: json['total_notifications'],
      unreadCount: json['unread_count'],
      highPriorityCount: json['high_priority_count'],
      mediumPriorityCount: json['medium_priority_count'],
      lowPriorityCount: json['low_priority_count'],
      recentNotifications: notificationsList,
      error: json['errors'],
    );
  }
}
