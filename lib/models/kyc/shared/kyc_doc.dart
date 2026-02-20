class KycDoc{
  final String docType;
  final String fileKey;
  final int id;
  final String fileUrl;
  final String fileName;
  final String contentType;
  final bool isVerified;
  final DateTime uploadedAt;
  final DateTime? verifiedAt;

  KycDoc({
    required this.docType,
    required this.fileKey,
    required this.id,
    required this.fileUrl,
    required this.fileName,
    required this.contentType,
    required this.isVerified,
    required this.uploadedAt,
    this.verifiedAt,
});

  factory KycDoc.fromJson(Map<String, dynamic> json) {
    return KycDoc(
      docType: json['doc_type'],
      fileKey: json['file_key'],
      id: json['id'],
      fileUrl: json['file_url'],
      fileName: json['file_name'],
      contentType: json['content_type'],
      isVerified: json['is_verified'],
      uploadedAt: DateTime.parse(json['uploaded_at']),
      verifiedAt: json['verified_at'] != null ? DateTime.tryParse(json['verified_at']) : null,
    );
  }
}