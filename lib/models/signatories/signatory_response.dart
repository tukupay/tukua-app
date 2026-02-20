class SignatoryResponse {
  final int? id;
  final int? walletId;
  final int? userId;
  final int? invitedBy;
  final String? phoneNumber;
  final String? email;
  final String? fullName;
  final String? role;
  final String? status;
  final DateTime? invitedAt;
  final DateTime? acceptedAt;
  final DateTime? removedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? userUsername;
  final String? userEmail;
  final String? invitedByUsername;
  String? error;

  SignatoryResponse({
    this.id,
    this.walletId,
    this.userId,
    this.invitedBy,
    this.phoneNumber,
    this.email,
    this.fullName,
    this.role,
    this.status,
    this.invitedAt,
    this.acceptedAt,
    this.removedAt,
    this.createdAt,
    this.updatedAt,
    this.userUsername,
    this.userEmail,
    this.invitedByUsername,
    this.error,
  });

  factory SignatoryResponse.fromJson(Map<String, dynamic> json) {
    return SignatoryResponse(
      id: json['id'],
      walletId: json['wallet_id'],
      userId: json['user_id'],
      invitedBy: json['invited_by'],
      phoneNumber: json['phone_number'],
      email: json['email'],
      fullName: json['full_name'],
      role: json['role'],
      status: json['status'],
      invitedAt: json['invited_at'] != null
          ? DateTime.parse(json['invited_at'])
          : null,
      acceptedAt: json['accepted_at'] != null
          ? DateTime.parse(json['accepted_at'])
          : null,
      removedAt: json['removed_at'] != null
          ? DateTime.parse(json['removed_at'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      userUsername: json['user_username'],
      userEmail: json['user_email'],
      invitedByUsername: json['invited_by_username'],
      error: json['errors'],
    );
  }
}

