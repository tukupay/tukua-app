import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:tuku/endpoints/endpoints.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';

import 'auth_http.dart';

class NotificationService implements NotificationRepository{
  final AuthHttp _http = AuthHttp();

  @override
  Future<NotificationsResponse> getNotifications(int offset, {bool unreadOnly=false})async{
    // add unread_only
    final resp=await _http.get(Uri.parse(Notifications().getNotifications(offset,unreadOnly)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET NOTIFICATIONS SAYS $jsonData");
    final notifications=NotificationsResponse.fromJson(jsonData);
    return notifications;
  }

  @override
  Future<NotificationStats> getStats()async{
    final resp=await _http.get(Uri.parse(Notifications().stats));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET STATS SAYS $jsonData");
    final stats=NotificationStats.fromJson(jsonData);
    return stats;
  }

  @override
  Future<String?> markAsRead(int id)async{
    final resp=await _http.patch(Uri.parse(Notifications().markAsRead(id)));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("MARK AS READ SAYS $jsonData");
    return jsonData['errors'];
  }

  @override
  Future<String?> markAllAsRead()async{
    final resp=await _http.patch(Uri.parse(Notifications().readAll));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("MARK ALL AS READ SAYS $jsonData");
    return jsonData['errors'];
  }

  @override
  Future<NotificationPreferences> getPreferences()async{
    final resp=await _http.get(Uri.parse(Notifications().preferences));
    final data=resp.body;
    final jsonData=json.decode(data);
    debugPrint("GET PREFERENCES SAYS $jsonData");
    final preferences=NotificationPreferences.fromJson(jsonData);
    return preferences;
  }

  @override
  Future<String?> updatePreferences(String type,bool enabled)async{
  final resp=await _http.patch(Uri.parse(Notifications().updatePreference(type)), body: jsonEncode({"notification_type":type,"enabled":enabled}));
  final data=resp.body;
  final jsonData=json.decode(data);
  debugPrint("UPDATE PREFERENCES SAYS $jsonData");
  return jsonData['errors'];
  }
}