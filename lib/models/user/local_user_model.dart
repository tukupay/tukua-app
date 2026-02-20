import 'package:isar/isar.dart';
part 'local_user_model.g.dart';
@collection
class LocalUserModel{
  Id id = Isar.autoIncrement;  // auto-incremented field

  int? userId;
  String? username;
  String? email;
  String? phoneNumber;
  String? type;
  String? status;
  bool? emailVerified;
  bool? phoneVerified;
  String? kycStatus;
  bool? twoFactorEnabled;
  bool? acceptedTerms;
  String? role;

  // individual profile
  String? firstName;
  String? middleName;
  String? lastName;
  String? title;
  String? dob;
  String? gender; // male | female | other
  String? nationalId;
  // String? district;
  // String? division;
  // String? location;
  // String? subLocation;

  // business profile
  String? businessName;
  String? businessType;
  String? registrationDate;
  String? certificateNumber;
  String? kraPin;

  // DateTime fields
  String? lastLoginAt;
  String? acceptedTermsAt;
  String? createdAt;
  String? updatedAt;

  String? profileImg;

  String? pinStatus;
  bool? requiresPinSetup;

  String? posName;
  String? posType;
  String? posStatus;
  String? posDescription;
  int? posWalletId; // Selected wallet for POS payments
}