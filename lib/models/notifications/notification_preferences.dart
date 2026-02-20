import 'dart:collection';
import 'package:flutter/foundation.dart';
import 'package:collection/collection.dart'; // Import the collection package

class NotificationPreferences {
  final bool? emailEnabled;
  final bool? smsEnabled;
  final bool? pushEnabled;
  final bool? inAppEnabled;
  final bool? highPriorityEnabled;
  final bool? mediumPriorityEnabled;
  final bool? lowPriorityEnabled;
  final bool? dailyDigestEnabled;
  final bool? weeklyDigestEnabled;
  final int? id;
  final int? userId;
  final Map<String, bool>? typePreferences;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? error;

  NotificationPreferences({
    this.emailEnabled,
    this.smsEnabled,
    this.pushEnabled,
    this.inAppEnabled,
    this.highPriorityEnabled,
    this.mediumPriorityEnabled,
    this.lowPriorityEnabled,
    this.dailyDigestEnabled,
    this.weeklyDigestEnabled,
    this.id,
    this.userId,
    this.typePreferences,
    this.createdAt,
    this.updatedAt,
    this.error,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      emailEnabled: json['email_enabled'],
      smsEnabled: json['sms_enabled'],
      pushEnabled: json['push_enabled'],
      inAppEnabled: json['in_app_enabled'],
      highPriorityEnabled: json['high_priority_enabled'],
      mediumPriorityEnabled: json['medium_priority_enabled'],
      lowPriorityEnabled: json['low_priority_enabled'],
      dailyDigestEnabled: json['daily_digest_enabled'],
      weeklyDigestEnabled: json['weekly_digest_enabled'],
      id: json['id'],
      userId: json['user_id'],
      typePreferences: json['type_preferences'] != null
          ? Map<String, bool>.from(json['type_preferences'])
          : null,
      createdAt:
          json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt:
          json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      error: json['errors'],
    );
  }

  Map<String, dynamic> toMap() {
    final Map<String, dynamic> data = {};
    if (emailEnabled != null) data['email_enabled'] = emailEnabled;
    if (smsEnabled != null) data['sms_enabled'] = smsEnabled;
    if (pushEnabled != null) data['push_enabled'] = pushEnabled;
    if (inAppEnabled != null) data['in_app_enabled'] = inAppEnabled;
    if (highPriorityEnabled != null) {
      data['high_priority_enabled'] = highPriorityEnabled;
    }
    if (mediumPriorityEnabled != null) {
      data['medium_priority_enabled'] = mediumPriorityEnabled;
    }
    if (lowPriorityEnabled != null) {
      data['low_priority_enabled'] = lowPriorityEnabled;
    }
    if (dailyDigestEnabled != null) {
      data['daily_digest_enabled'] = dailyDigestEnabled;
    }
    if (weeklyDigestEnabled != null) {
      data['weekly_digest_enabled'] = weeklyDigestEnabled;
    }
    if (typePreferences != null) data['type_preferences'] = typePreferences;
    return data;
  }

  NotificationPreferences copyWith({
    bool? emailEnabled,
    bool? smsEnabled,
    bool? pushEnabled,
    bool? inAppEnabled,
    bool? highPriorityEnabled,
    bool? mediumPriorityEnabled,
    bool? lowPriorityEnabled,
    bool? dailyDigestEnabled,
    bool? weeklyDigestEnabled,
    Map<String, bool>? typePreferences,
  }) {
    return NotificationPreferences(
      emailEnabled: emailEnabled ?? this.emailEnabled,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      pushEnabled: pushEnabled ?? this.pushEnabled,
      inAppEnabled: inAppEnabled ?? this.inAppEnabled,
      highPriorityEnabled: highPriorityEnabled ?? this.highPriorityEnabled,
      mediumPriorityEnabled: mediumPriorityEnabled ?? this.mediumPriorityEnabled,
      lowPriorityEnabled: lowPriorityEnabled ?? this.lowPriorityEnabled,
      dailyDigestEnabled: dailyDigestEnabled ?? this.dailyDigestEnabled,
      weeklyDigestEnabled: weeklyDigestEnabled ?? this.weeklyDigestEnabled,
      id: this.id,
      userId: this.userId,
      typePreferences: typePreferences ?? this.typePreferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      error: this.error,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationPreferences &&
          runtimeType == other.runtimeType &&
          emailEnabled == other.emailEnabled &&
          smsEnabled == other.smsEnabled &&
          pushEnabled == other.pushEnabled &&
          inAppEnabled == other.inAppEnabled &&
          highPriorityEnabled == other.highPriorityEnabled &&
          mediumPriorityEnabled == other.mediumPriorityEnabled &&
          lowPriorityEnabled == other.lowPriorityEnabled &&
          dailyDigestEnabled == other.dailyDigestEnabled &&
          weeklyDigestEnabled == other.weeklyDigestEnabled &&
          mapEquals(typePreferences, other.typePreferences);

  @override
  int get hashCode =>
      Object.hash(
        emailEnabled, smsEnabled, pushEnabled, inAppEnabled,
        highPriorityEnabled, mediumPriorityEnabled, lowPriorityEnabled,
        dailyDigestEnabled, weeklyDigestEnabled, 
        typePreferences != null ? mapHash(typePreferences!) : 0
      );

  bool mapEquals(Map<String, bool>? a, Map<String, bool>? b) {
    if (a == null) return b == null;
    if (b == null || a.length != b.length) return false;
    if (identical(a, b)) return true;
    for (final String key in a.keys) {
      if (!b.containsKey(key) || a[key] != b[key]) {
        return false;
      }
    }
    return true;
  }

  int mapHash(Map<String, bool> map) {
    return UnorderedIterableEquality().hash(map.entries.map((e) => MapEntry(e.key, e.value)));
  }
}
