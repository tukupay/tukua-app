class ContributionRequest {
  final double amount;
  final String? message;
  final bool isAnonymous;
  final String paymentMethod;
  final int? walletId;
  final String contributorName;
  final String contributorEmail;
  final String contributorPhone;

  ContributionRequest({
    required this.amount,
    this.message,
    required this.isAnonymous,
    required this.paymentMethod,
    this.walletId,
    required this.contributorName,
    required this.contributorEmail,
    required this.contributorPhone,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'amount': amount,
      'is_anonymous': isAnonymous,
      'payment_method': paymentMethod,
      'contributor_name': contributorName,
      'contributor_email': contributorEmail,
      'contributor_phone': contributorPhone
    };

    if (message != null) {
      data['message'] = message;
    }
    if(walletId != null){
      data['wallet_id']= walletId;
    }
    return data;
  }


}


