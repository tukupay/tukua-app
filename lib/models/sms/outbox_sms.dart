class OutboxSms {
  final int? id;
  final String? phoneNumber;
  final String? message;
  final String? status;
  final String? responseMessage;
  final DateTime? createdAt;
  String? error;

  OutboxSms({
     this.id,
     this.phoneNumber,
     this.message,
     this.status,
    this.responseMessage,
     this.createdAt,
    this.error
  });

  factory OutboxSms.fromJson(Map<String, dynamic> json) {
    return OutboxSms(
      id: json['id'],
      phoneNumber: json['phone_number'],
      message: json['message'],
      status: json['status'],
      responseMessage: json['response_message'] as String?,
      createdAt: json['created_at']!=null? DateTime.parse(json['created_at']):null,
      error: json['errors']
    );
  }
}

