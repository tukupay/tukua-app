import 'dart:io';

import 'package:flutter/foundation.dart';

class FileSizeChecker{
  bool isLarge(File? file){
    if (file==null) return false;
    int sizeInBytes=file.lengthSync();
    int maxSizeInBytes=(1.8 * 1024 * 1024).toInt();
    debugPrint('### PICKED FILE IS LARGE ? ${sizeInBytes>maxSizeInBytes} ###');
    return sizeInBytes > maxSizeInBytes;
  }
}