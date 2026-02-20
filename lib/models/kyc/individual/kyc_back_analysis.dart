class KycBackAnalysis {
  final String district;
  final String division;
  final String location;
  final String subLocation;

  KycBackAnalysis(
      {required this.district,
      required this.division,
      required this.location,
      required this.subLocation});

  factory KycBackAnalysis.fromJson(Map<String, dynamic> json) =>
      KycBackAnalysis(
          district: json['district'],
          division: json['division'],
          location: json['location'],
          subLocation: json['sub_location']);
}
