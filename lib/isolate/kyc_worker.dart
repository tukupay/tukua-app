import 'dart:io';
import 'dart:isolate';
import 'package:flutter/services.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import '../utils/utils.dart';
import '../models/models.dart';

void uploadKycIsolate(List args) async {
  // Extract args first
  final SendPort sendPort = args[0];
  final String docType = args[1];
  final String filePath = args[2];
  final String fileType = args[3];
  final String fileExt = args[4];
  final String url = args[5];
  final RootIsolateToken token = args[6];

  // MUST initialize binary messenger BEFORE creating services that use platform channels
  BackgroundIsolateBinaryMessenger.ensureInitialized(token);

  // Now safe to create services that use path_provider
  KycRepository api = KycService();
  final sizeChecker = FileSizeChecker();
  File? image;
  // CHECK IF FILE IS LARGE
  if(sizeChecker.isLarge(File(filePath))){
    // COMPRESS BEFORE UPLOAD
    image=await compressImage(File(filePath));
  }else{
    image=File(filePath);
  }
  // UPLOAD DOC
  KycModel kyc=await api.uploadDocument(
      docType: docType,
      selectedFile: image!,
      fileType: fileType,
      fileExt: fileExt,
      url: url);
  sendPort.send(kyc);
}