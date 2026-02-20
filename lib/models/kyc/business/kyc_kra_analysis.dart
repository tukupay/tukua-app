class KycKraAnalysis{
  final String pinNumber;
  final String payerName;

  KycKraAnalysis({
    required this.pinNumber,
    required this.payerName
});

  factory KycKraAnalysis.fromJson(Map<String,dynamic> json){
    return KycKraAnalysis(
        pinNumber: json['pin_number'],
        payerName: json['taxpayer_name']);
  }
}