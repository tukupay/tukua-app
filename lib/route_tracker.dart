
import 'package:flutter/material.dart';

class RouteTracker extends NavigatorObserver {
  static String? currentRoute;

  @override
  void didPush(Route route, Route? previousRoute) {
    currentRoute = route.settings.name;
    debugPrint("➡️ Pushed ${route.settings.name}");
  }

  @override
  void didPop(Route route, Route? previousRoute) {
    currentRoute = previousRoute?.settings.name;
    debugPrint("⬅️ Back to ${previousRoute?.settings.name}");
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    currentRoute = newRoute?.settings.name;
    debugPrint("🔄 Replaced with ${newRoute?.settings.name}");
  }
}
