import '../models/models.dart';
abstract class NotificationRepository{

  Future<NotificationsResponse> getNotifications(int offset,{bool unreadOnly});

  Future<NotificationStats> getStats();

  Future<String?> markAsRead(int id);

  Future<String?> markAllAsRead();

  Future<NotificationPreferences> getPreferences();

  Future<String?> updatePreferences(String type,bool enabled);
  
}