import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';

class NotificationProvider extends ChangeNotifier {
  // All Notifications State
  bool _loadingAllNotifications = false;
  bool get loadingAllNotifications => _loadingAllNotifications;
  List<NotificationModel> _allNotifications = [];
  List<NotificationModel> get allNotifications => _allNotifications;
  int _allCurrentPage = 1;
  bool _allHasMorePages = true;
  bool _loadingMoreAll = false;
  bool get loadingMoreAll => _loadingMoreAll;

  // Unread Notifications State
  bool _loadingUnreadNotifications = false;
  bool get loadingUnreadNotifications => _loadingUnreadNotifications;
  List<NotificationModel> _unreadNotifications = [];
  List<NotificationModel> get unreadNotifications => _unreadNotifications;
  int _unreadCurrentPage = 1;
  bool _unreadHasMorePages = true;
  bool _loadingMoreUnread = false;
  bool get loadingMoreUnread => _loadingMoreUnread;

  // Other States
  NotificationModel? _selectedNotification;
  NotificationModel? get selectedNotification => _selectedNotification;
  NotificationStats? _notificationStats;
  NotificationStats? get notificationStats => _notificationStats;
  bool _loadingPreferences = false;
  bool get loadingPreferences => _loadingPreferences;
  NotificationPreferences? _preferences;
  NotificationPreferences? get preferences => _preferences;
  NotificationPreferences? _originalPreferences;
  bool _updatingPreferences = false;
  bool get updatingPreferences => _updatingPreferences;

  NotificationRepository api = NotificationService();

  Future<void> getAllNotifications({bool isRefresh = false}) async {
    if (isRefresh) {
      _allCurrentPage = 1;
      _allNotifications = [];
      _allHasMorePages = true;
      _loadingAllNotifications = true;
    } else {
      if (_loadingMoreAll || !_allHasMorePages) return;
      _loadingMoreAll = true;
    }
    notifyListeners();

    final offset = (_allCurrentPage - 1) * 10;
    final resp = await api.getNotifications(offset, unreadOnly: false);

    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _allNotifications.addAll(resp.notifications ?? []);
      _allHasMorePages = resp.hasMore ?? false;
      if (resp.notifications?.isNotEmpty ?? false) {
        _allCurrentPage++;
      }
    }

    if (isRefresh) {
      _loadingAllNotifications = false;
    } else {
      _loadingMoreAll = false;
    }
    notifyListeners();
  }

  Future<void> getUnreadNotifications({bool isRefresh = false}) async {
    if (isRefresh) {
      _unreadCurrentPage = 1;
      _unreadNotifications = [];
      _unreadHasMorePages = true;
      _loadingUnreadNotifications = true;
    } else {
      if (_loadingMoreUnread || !_unreadHasMorePages) return;
      _loadingMoreUnread = true;
    }
    notifyListeners();

    final offset = (_unreadCurrentPage - 1) * 10;
    final resp = await api.getNotifications(offset, unreadOnly: true);

    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _unreadNotifications.addAll(resp.notifications ?? []);
      _unreadHasMorePages = resp.hasMore ?? false;
      if (resp.notifications?.isNotEmpty ?? false) {
        _unreadCurrentPage++;
      }
    }

    if (isRefresh) {
      _loadingUnreadNotifications = false;
    } else {
      _loadingMoreUnread = false;
    }
    notifyListeners();
  }

  Future<void> getStats() async {
    final resp = await api.getStats();
    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _notificationStats = resp;
    }
    notifyListeners();
  }

  Future<void> markAsRead(int id) async {
    final resp = await api.markAsRead(id);
    if (resp == null) {
      // Flag to ensure we only decrement the counter once.
      bool wasJustMarkedAsRead = false;

      // 1. Update the item in the 'all' list if it exists and was unread.
      final indexAll = _allNotifications.indexWhere((n) => n.id == id);
      if (indexAll != -1 && _allNotifications[indexAll].status != 'read') {
        _allNotifications[indexAll].status = 'read';
        wasJustMarkedAsRead = true;
      }

      // 2. Remove the item from the 'unread' list if it exists. This is a definitive
      //    sign that it was unread.
      final indexUnread = _unreadNotifications.indexWhere((n) => n.id == id);
      if (indexUnread != -1) {
        _unreadNotifications.removeAt(indexUnread);
        wasJustMarkedAsRead = true;
      }

      // 3. If we confirmed the item was unread, update the stats count.
      if (wasJustMarkedAsRead) {
        if (_notificationStats != null && (_notificationStats!.unreadCount ?? 0) > 0) {
          _notificationStats!.unreadCount = _notificationStats!.unreadCount! - 1;
        }
      }

      // 4. Notify listeners to update the UI regardless, as an item might have been removed.
      notifyListeners();

    } else {
      Fluttertoast.showToast(msg: resp);
    }
  }

  Future<void> markAllAsRead() async {
    final resp = await api.markAllAsRead();
    if (resp == null) {
      for (var notification in _allNotifications) {
        notification.status = 'read';
      }
      _unreadNotifications.clear();
      if (_notificationStats != null) {
        _notificationStats!.unreadCount = 0;
      }
      notifyListeners();
    } else {
      Fluttertoast.showToast(msg: resp);
    }
  }

  Future<void> selectNotification(NotificationModel notification) async {
    _selectedNotification = notification;
    if (notification.status != 'read') {
      await markAsRead(notification.id!);
    }
    notifyListeners();
  }

  void resetNotification() {
    _selectedNotification = null;
    notifyListeners();
  }

  Future<void> getPreferences() async {
    _loadingPreferences = true;
    notifyListeners();
    final resp = await api.getPreferences();
    if (resp.error != null) {
      Fluttertoast.showToast(msg: resp.error!);
    } else {
      _preferences = resp;
      _originalPreferences = resp.copyWith();
    }
    _loadingPreferences = false;
    notifyListeners();
  }

  bool havePreferencesChanged() {
    return _preferences != _originalPreferences;
  }

  Future<void> updatePreferenceValue(String key, bool value,BuildContext context)async{
    _updatingPreferences = true;
    notifyListeners();
    Fluttertoast.cancel();
    final resp = await api.updatePreferences(key, value);
    if(resp!=null){
      Fluttertoast.showToast(msg: resp);
    }else{
      Fluttertoast.showToast(msg: "Preference updated");
      Navigator.pop(context);
    }
    _updatingPreferences=false;
    notifyListeners();
  }
}
