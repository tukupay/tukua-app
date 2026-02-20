class KycCertAnalysis {
  final String businessName;
  final String regDate;
  String? certNumber;
  String? businessType;
  List<dynamic>? directors;

  KycCertAnalysis({
    required this.businessName,
    required this.regDate,
    this.certNumber,
    this.businessType,
    this.directors
});

  factory KycCertAnalysis.fromJson(Map<String,dynamic> json){
    return KycCertAnalysis(
        businessName: json['business_name'],
        regDate: json['registration_date'],
        certNumber: json['certificate_number'],
        businessType: json['business_type'],
      directors: json['directors']);
  }
}

