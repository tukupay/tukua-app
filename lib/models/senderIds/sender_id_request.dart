class SenderIdRequest {
  final List<String> requestedSenderIds;
  final String? reason;

  SenderIdRequest({
    required this.requestedSenderIds,
    this.reason,
  });

  factory SenderIdRequest.fromJson(Map<String, dynamic> json) {
    return SenderIdRequest(
      requestedSenderIds: List<String>.from(json['requested_sender_ids']),
      reason: json['reason'],
    );
  }

  Map<String, dynamic> toJson()=> {
    'requested_sender_ids': requestedSenderIds,
    'reason': reason
  };
}
