import 'package:flutter/foundation.dart';

class ChurchTeachingsProvider extends ChangeNotifier{
  bool _isGrid=true;
  bool get isGrid=>_isGrid;

  void videosView(bool val){
    _isGrid=val;
    notifyListeners();
  }
}