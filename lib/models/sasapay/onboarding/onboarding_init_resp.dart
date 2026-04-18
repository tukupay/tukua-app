class OnboardingInitResp {
  String? requestId;
  String? message;
  String? error;

  OnboardingInitResp({
    this.requestId,
    this.message,
    this.error,
  });

  factory OnboardingInitResp.fromJson(Map<String,dynamic> json){
    return OnboardingInitResp(
      requestId: json['requestId'],
      message: json['message'],
      error: json['errors'],
    );
  }
}