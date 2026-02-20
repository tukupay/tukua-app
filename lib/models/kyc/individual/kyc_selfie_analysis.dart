class KycSelfieAnalysis{
  final bool isPerson;

  KycSelfieAnalysis({
   required this.isPerson
});

  factory KycSelfieAnalysis.fromJson(Map<String,dynamic> json)=>
      KycSelfieAnalysis(
        isPerson: json['is_a_real_person']
      );
}