class KycFrontAnalysis{
  final String title;
  final String firstName;
  final String middleName;
  final String? lastName;
  final String nationalId;
  final String gender;
  final String dob;

  KycFrontAnalysis({
    required this.title,
    required this.firstName,
    required this.middleName,
    this.lastName,
    required this.nationalId,
    required this.gender,
    required this.dob,
});

  factory KycFrontAnalysis.fromJson(Map<String, dynamic> json) {
    return KycFrontAnalysis(
      title: json['title'],
      firstName: json['first_name'],
      middleName: json['middle_name'],
      lastName: json['last_name'],
      nationalId: json['national_id'],
      gender: json['gender'],
      dob: json['dob'],
    );
  }
}