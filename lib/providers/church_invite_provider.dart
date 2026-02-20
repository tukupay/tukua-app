import 'package:flutter/foundation.dart';

class ChurchInviteProvider extends ChangeNotifier{
  List<String> genders=['Male','Female'];
  List<String> memberTypes=['Friend','Visitor','New Believer'];

  String? _selectedGender;
  String? get selectedGender=>_selectedGender;

  String? _selectedType;
  String? get selectedType=>_selectedType;

  void selectType(String type){
    _selectedType=type;
    notifyListeners();
  }

  void selectGender(String gender){
    _selectedGender=gender;
    notifyListeners();
  }
}