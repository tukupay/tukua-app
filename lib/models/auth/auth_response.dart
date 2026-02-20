class AuthResponse{
  String? accessToken;
  String? refreshToken;
  String? tokenType;
  String? error;
  String? message;

  AuthResponse({
    this.accessToken,
    this.refreshToken,
    this.tokenType,
    this.error,
    this.message});

  factory AuthResponse.fromJson(Map<String,dynamic> json)=>
      AuthResponse(
          accessToken: json['access_token'],
          refreshToken: json['refresh_token'],
          tokenType: json['token_type'],
          error: json['errors'],
          message: json['message']);
}