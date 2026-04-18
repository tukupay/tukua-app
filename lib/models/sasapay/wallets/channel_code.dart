class ChannelCode {
  String name;
  String code;

  ChannelCode({
    required this.name,
    required this.code,
  });

  factory ChannelCode.fromJson(Map<String,dynamic> json){
    return ChannelCode(
      name: json['name'],
      code: json['code'],
    );
  }
}