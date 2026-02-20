import 'package:tuku/constants/constants.dart';

import '../models.dart';

class UserModel {
  final int? id; // required
  final String? username; // required
  final String? email;
  final String? phoneNumber; // required
  final String? type; // required
  final String? status; // required
  final bool? emailVerified; // required
  final bool? phoneVerified; // required
  final String? kycStatus; // required
  final bool? twoFactorEnabled; // required
  final bool? acceptedTerms; // required
  final String? role; // required
  final IndividualProfile? individualProfile;
  final BusinessProfile? businessProfile;
  final DateTime? lastLoginAt;
  final DateTime? acceptedTermsAt;
  final DateTime? createdAt; // required
  final DateTime? updatedAt; // required
  final String? profileImgUrl;

  final String? pinStatus;
  final bool? requiresPinSetup;
  final PosSnippet? stk;

  String? error;


  UserModel({
     this.id,
     this.username,
    this.email,
     this.phoneNumber,
     this.type,
     this.status,
     this.emailVerified,
     this.phoneVerified,
     this.kycStatus,
     this.twoFactorEnabled,
     this.acceptedTerms,
     this.role,
    this.individualProfile,
    this.businessProfile,
    this.lastLoginAt,
    this.acceptedTermsAt,
     this.createdAt,
     this.updatedAt,
    this.profileImgUrl,

    this.pinStatus,
    this.requiresPinSetup,
    this.stk,

    this.error
  });

  // Factory constructor to create a User object from JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      phoneNumber: json['phone_number'],
      type: json['type'],
      status: json['status'],
      emailVerified: json['email_verified'],
      phoneVerified: json['phone_verified'],
      kycStatus: json['kyc_status'],
      twoFactorEnabled: json['two_factor_enabled'],
      acceptedTerms: json['accepted_terms'],
      role: json['role'],
      individualProfile: json['individual_profile']!=null? IndividualProfile.fromJson(json['individual_profile']):null,
      businessProfile: json['business_profile']!=null? BusinessProfile.fromJson(json['business_profile']):null,
      lastLoginAt: json['last_login_at']!=null ? DateTime.parse(json['last_login_at']):null,
      acceptedTermsAt: json['accepted_terms_at']!=null ? DateTime.parse(json['accepted_terms_at']):null,
      createdAt: json['created_at']!=null ? DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null ? DateTime.parse(json['updated_at']):null,
      profileImgUrl: json['profile_image_url'],
      pinStatus: json['pin_status'],
      requiresPinSetup: json['requires_pin_setup'],
      stk: json['stk']!=null? PosSnippet.fromJson(json['stk']):null,
      error: json['errors']
    );
  }

}
