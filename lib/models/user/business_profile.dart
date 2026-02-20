class BusinessProfile {
  String? businessName;
  String? businessType;
  DateTime? registrationDate;
  String? certificateNumber;
  String? pinNumber;

  BusinessProfile({
    this.businessName,
    this.businessType,
    this.registrationDate,
    this.certificateNumber,
    this.pinNumber,
  });

  // Factory constructor to create BusinessProfile object from JSON
  factory BusinessProfile.fromJson(Map<String, dynamic> json) {
    return BusinessProfile(
      businessName: json['business_name'],
      businessType: json['business_type'],
      registrationDate: DateTime.parse(json['registration_date']),
      certificateNumber: json['certificate_number'],
      pinNumber: json['pin_number'],
    );
  }

  // Method to convert BusinessProfile object back to JSON
  // Map<String, dynamic> toJson() {
  //   return {
  //     'business_names': businessName,
  //     'business_type': businessType,
  //     'registration_date': registrationDate.toIso8601String(),
  //     'certificate_number': certificateNumber,
  //     'pin_number': pinNumber,
  //   };
  // }
}