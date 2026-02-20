import 'package:isar/isar.dart';

part 'local_kyc_model.g.dart';

@Collection()
class LocalKycModel {
  // update this model
  Id id = Isar.autoIncrement;

  int? kycId;
  String? docType;
  String? fileKey;
  String? fileUrl;
  String? fileName;
  String? contentType;
  bool? isVerified;
  String? uploadedAt;
  String? verifiedAt;

  String? title;
  String? firstName;
  String? middleName;
  String? lastName;
  String? nationalId;
  String? gender;
  String? dob;

  String? district;
  String? division;
  String? location;
  String? subLocation;

  bool? isFace;

  String? businessName;
  String? regDate;
  String? certNumber;
  String? businessType;
  // List<String>? directors;

  String? kraPin;
  String? payerName;
}
