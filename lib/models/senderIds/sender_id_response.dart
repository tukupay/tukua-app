class SenderIdResponse {
  final int? id;
  final int? userId;
  final List<String>? requestedSenderIds;
  final String? reason;
  final String? status; // active | inactive | suspended
  final String? approvedSenderId;
  final String? rejectionReason;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  String? error;

  SenderIdResponse({
    this.id,
    this.userId,
    this.requestedSenderIds,
    this.reason,
    this.status,
    this.approvedSenderId,
    this.rejectionReason,
    this.createdAt,
    this.updatedAt,
    this.error
  });

  factory SenderIdResponse.fromJson(Map<String, dynamic> json) {
    return SenderIdResponse(
      id: json['id'],
      userId: json['user_id'],
      requestedSenderIds: json['requested_sender_ids']!=null?List<String>.from(json['requested_sender_ids']):null,
      reason: json['reason'],
      status: json['status'],
      approvedSenderId: json['approved_sender_id'],
      rejectionReason: json['rejection_reason'],
      createdAt: json['created_at']!=null? DateTime.parse(json['created_at']):null,
      updatedAt: json['updated_at']!=null?DateTime.parse(json['updated_at']):null,
      error: json['errors']
    );
  }

}


