import 'dart:io';

import 'package:tuku/models/models.dart';

abstract class KycRepository{
  Future<KycModel>uploadDocument({required String docType,
    required File selectedFile,required String fileType,required String fileExt,
    required String url});

  Future<List<KycModel>?> listDocuments();

  Future<KycModel> getDocument(int id);

  Future<String?> applyAnalysis(int kycId);

  Future<String?> deleteDocument(int id);

}