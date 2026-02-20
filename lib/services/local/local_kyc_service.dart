import 'package:flutter/foundation.dart';
import 'package:isar/isar.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import '../../models/models.dart';

class LocalKycService implements LocalKycRepository{

  late Future<Isar> isarDb;

  LocalKycService(){
    isarDb=openDb();
  }

  @override
  Future<List<LocalKycModel>> saveKycs(List<KycModel> kycs)async{
    List<LocalKycModel> localKycs=[];
    for(KycModel kyc in kycs){
      if(kyc.document?.docType==Strings.frontId){ // front id
        final front=await saveFrontKyc(kyc);
        localKycs.add(front);
      }
      else if(kyc.document?.docType==Strings.backId){ // back id
        final back=await saveBackKyc(kyc);
        localKycs.add(back);
      }
      else if(kyc.document?.docType==Strings.selfie){ // selfie | logo
        final selfie=await saveSelfieKyc(kyc);
        localKycs.add(selfie);
      }else if(kyc.document?.docType==Strings.businessCert){ // business cert
        final cert=await saveCertKyc(kyc);
        localKycs.add(cert);
      }else if(kyc.document?.docType==Strings.kraPinCert){ // kra pin cert
        final kra=await saveKraKyc(kyc);
        localKycs.add(kra);
      }
    }
    return localKycs;
  }

  @override
  Future<List<LocalKycModel>> getKycs()async{
    final db=await isarDb;
    List<LocalKycModel> kycs=await db.localKycModels.where().findAll();
    return kycs;
  }

  @override
  Future<void> deleteKyc(int kycId)async{
    final db=await isarDb;
    final kyc=await db.localKycModels.filter().kycIdEqualTo(kycId).findFirst();
    if(kyc!=null){
      debugPrint('===> DELETING KYC $kycId <===');
      await db.writeTxn(()async{
        await db.localKycModels.delete(kyc.id);
      });
    }
  }

  @override
  Future<LocalKycModel> saveFrontKyc(KycModel kyc)async{
    final db=await isarDb;
    LocalKycModel localKyc=LocalKycModel()
    ..kycId=kyc.document!.id
    ..docType=kyc.document!.docType
    ..fileKey=kyc.document!.fileKey
    ..fileUrl=kyc.document!.fileUrl
    ..fileName=kyc.document!.fileName
    ..contentType=kyc.document!.contentType
    ..isVerified=kyc.document!.isVerified
    ..uploadedAt=kyc.document!.uploadedAt.toIso8601String()
    ..verifiedAt=kyc.document!.verifiedAt?.toIso8601String()

    ..title=kyc.frontAnalysis?.title
    ..firstName=kyc.frontAnalysis?.firstName
    ..middleName=kyc.frontAnalysis?.middleName
    ..lastName=kyc.frontAnalysis?.lastName
    ..nationalId=kyc.frontAnalysis?.nationalId
    ..gender=kyc.frontAnalysis?.gender
    ..dob=kyc.frontAnalysis?.dob;

    db.writeTxnSync(()=> db.localKycModels.putSync(localKyc));
    return localKyc;
  }

  @override
  Future<LocalKycModel> saveBackKyc(KycModel kyc)async{
    final db=await isarDb;
    LocalKycModel localKyc=LocalKycModel()
      ..kycId=kyc.document!.id
      ..docType=kyc.document!.docType
      ..fileKey=kyc.document!.fileKey
      ..fileUrl=kyc.document!.fileUrl
      ..fileName=kyc.document!.fileName
      ..contentType=kyc.document!.contentType
      ..isVerified=kyc.document!.isVerified
      ..uploadedAt=kyc.document!.uploadedAt.toIso8601String()
      ..verifiedAt=kyc.document!.verifiedAt?.toIso8601String()

      ..district=kyc.backAnalysis?.district
      ..division=kyc.backAnalysis?.division
      ..location=kyc.backAnalysis?.location
      ..subLocation=kyc.backAnalysis?.subLocation;

    db.writeTxnSync(()=>db.localKycModels.putSync(localKyc));
    return localKyc;
  }

  @override
  Future<LocalKycModel> saveSelfieKyc(KycModel kyc)async{
    final db=await isarDb;
    LocalKycModel localKyc=LocalKycModel()
      ..kycId=kyc.document!.id
      ..docType=kyc.document!.docType
      ..fileKey=kyc.document!.fileKey
      ..fileUrl=kyc.document!.fileUrl
      ..fileName=kyc.document!.fileName
      ..contentType=kyc.document!.contentType
      ..isVerified=kyc.document!.isVerified
      ..uploadedAt=kyc.document!.uploadedAt.toIso8601String()
      ..verifiedAt=kyc.document!.verifiedAt?.toIso8601String()

      ..isFace=kyc.selfieAnalysis?.isPerson;

    db.writeTxnSync(()=>db.localKycModels.putSync(localKyc));
    return localKyc;
  }

  @override
  Future<LocalKycModel> saveCertKyc(KycModel kyc)async{
    final db=await isarDb;
    LocalKycModel localKyc=LocalKycModel()
      ..kycId=kyc.document!.id
      ..docType=kyc.document!.docType
      ..fileKey=kyc.document!.fileKey
      ..fileUrl=kyc.document!.fileUrl
      ..fileName=kyc.document!.fileName
      ..contentType=kyc.document!.contentType
      ..isVerified=kyc.document!.isVerified
      ..uploadedAt=kyc.document!.uploadedAt.toIso8601String()
      ..verifiedAt=kyc.document!.verifiedAt?.toIso8601String()

      ..businessName=kyc.certAnalysis?.businessName
      ..regDate=kyc.certAnalysis?.regDate
      ..certNumber=kyc.certAnalysis?.certNumber
      ..businessType=kyc.certAnalysis?.businessType;
      // ..directors=kyc.certAnalysis?.directors?.cast<String>();

    db.writeTxnSync(()=>db.localKycModels.putSync(localKyc));
    return localKyc;

  }

  @override
  Future<LocalKycModel> saveKraKyc(KycModel kyc)async{
    final db=await isarDb;
    LocalKycModel localKyc=LocalKycModel()
      ..kycId=kyc.document!.id
      ..docType=kyc.document!.docType
      ..fileKey=kyc.document!.fileKey
      ..fileUrl=kyc.document!.fileUrl
      ..fileName=kyc.document!.fileName
      ..contentType=kyc.document!.contentType
      ..isVerified=kyc.document!.isVerified
      ..uploadedAt=kyc.document!.uploadedAt.toIso8601String()
      ..verifiedAt=kyc.document!.verifiedAt?.toIso8601String()

      ..kraPin=kyc.kraAnalysis?.pinNumber
      ..payerName=kyc.kraAnalysis?.payerName;

    db.writeTxnSync(()=>db.localKycModels.putSync(localKyc));
    return localKyc;
  }
}