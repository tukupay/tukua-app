import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

class KycModel {
  final KycDoc? document;

  final KycFrontAnalysis? frontAnalysis;
  final KycBackAnalysis? backAnalysis;
  final KycSelfieAnalysis? selfieAnalysis;

  final KycCertAnalysis? certAnalysis;
  final KycKraAnalysis? kraAnalysis;

  final String? message;
  final String? error;

  KycModel({
    this.document,

    this.frontAnalysis,
    this.backAnalysis,
    this.selfieAnalysis,

    this.certAnalysis,
    this.kraAnalysis,

    this.message,
    this.error
  });

  factory KycModel.fromJson(Map<String, dynamic> json) {
    // Decode the KycDoc first
    final document = json['document']!=null ? KycDoc.fromJson(json['document']):null;

    // Decode front and back analysis conditionally based on document type
    KycFrontAnalysis? frontAnalysis;
    KycBackAnalysis? backAnalysis;
    KycSelfieAnalysis? selfieAnalysis;

    // Decode business certificate and kra pin cert conditionally
    KycCertAnalysis? certAnalysis;
    KycKraAnalysis? kraAnalysis;

    if (document?.docType == Strings.frontId) { // if frontId
      frontAnalysis = json['analysis'] != null ? KycFrontAnalysis.fromJson(json['analysis']) : null;
    }
    else if (document?.docType == Strings.backId) { // if backId
      backAnalysis = json['analysis'] != null ? KycBackAnalysis.fromJson(json['analysis']) : null;
    }
    else if(document?.docType == Strings.selfie) { // if selfie
      selfieAnalysis = json['analysis'] != null ? KycSelfieAnalysis.fromJson(json['analysis']) : null;
    }

    else if(document?.docType==Strings.businessCert){ // if business cert.
      certAnalysis = json['analysis'] != null ? KycCertAnalysis.fromJson(json['analysis']): null;
    }else if(document?.docType==Strings.kraPinCert){ // if kra pin cert.
      kraAnalysis = json['analysis'] !=null ? KycKraAnalysis.fromJson(json['analysis']):null;
    }

    // Return the KycModel
    return KycModel(
      document: document,

      frontAnalysis: frontAnalysis,
      backAnalysis: backAnalysis,
      selfieAnalysis: selfieAnalysis,

      certAnalysis: certAnalysis,
      kraAnalysis: kraAnalysis,

      message: json['message'],
      error: json['errors']
    );
  }
}
