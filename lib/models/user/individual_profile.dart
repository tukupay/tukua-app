class IndividualProfile {
  final String firstName;
  final String? middleName;
  final String lastName;
  final String title;
  final DateTime dob;
  final String? gender; // male | female | other
  final String? kraPin;
  final String? nationalId;
  final String? district;
  final String? division;
  final String? location;
  final String? subLocation;

  IndividualProfile({
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.title,
    required this.dob,
    this.gender,
    this.kraPin,
    this.nationalId,
    this.district,
    this.division,
    this.location,
    this.subLocation,
  });

  // Factory constructor to create IndividualProfile object from JSON
  factory IndividualProfile.fromJson(Map<String, dynamic> json) {
    return IndividualProfile(
      firstName: json['first_name'],
      middleName: json['middle_name'],
      lastName: json['last_name'],
      title: json['title'],
      dob: DateTime.parse(json['dob']),
      gender: json['gender'],
      kraPin: json['kra_pin'],
      nationalId: json['national_id'],
      district: json['district'],
      division: json['division'],
      location: json['location'],
      subLocation: json['sub_location'],
    );
  }
  //
  // // Method to convert IndividualProfile object back to JSON
  // Map<String, dynamic> toJson() {
  //   return {
  //     'first_name': firstName,
  //     'middle_name': middleName,
  //     'last_name': lastName,
  //     'title': title,
  //     'dob': dob.toIso8601String(),
  //     'gender': gender,
  //     'kra_pin': kraPin,
  //     'national_id': nationalId,
  //     'district': district,
  //     'division': division,
  //     'location': location,
  //     'sub_location': subLocation,
  //   };
  // }
}
