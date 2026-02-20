import 'package:flutter/foundation.dart';

class BillsProvider extends ChangeNotifier{
  String? _reminderType;
  String? get reminderType=>_reminderType;

  void selectReminderType(String type){
    _reminderType=type;
    notifyListeners();
  }
}