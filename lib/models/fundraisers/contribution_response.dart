class ContributionResponse {
   double? amount;
   String? message;
   bool? isAnonymous;
   int? id;
   int? campaignId;
   int? contributorId;
   String? contributorName;
   String? contributorEmail;
   String? contributorPhone;
   int? walletId;
   DateTime? contributedAt;
   String? transferType;
   String? error;

  ContributionResponse({
     this.amount,
    this.message,
     this.isAnonymous,
     this.id,
     this.campaignId,
    this.contributorId,
    this.contributorName,
    this.contributorEmail,
    this.contributorPhone,
     this.walletId,
     this.contributedAt,
    this.transferType,
    this.error
  });

  factory ContributionResponse.fromJson(Map<String, dynamic> json) {
    return ContributionResponse(
      amount: (json['amount']),
      message: json['message'],
      isAnonymous: json['is_anonymous'],
      id: json['id'],
      campaignId: json['campaign_id'],
      contributorId: json['contributor_id'],
      contributorName: json['contributor_name'],
      contributorEmail: json['contributor_email'],
      contributorPhone: json['contributor_phone'],
      walletId: json['wallet_id'],
      contributedAt: json['contributed_at']!=null?
      DateTime.parse(json['contributed_at']):null,
      transferType: json['transfer_type'],
      error: json['errors']
    );
  }

}

