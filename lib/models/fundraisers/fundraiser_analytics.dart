class FundraiserAnalytics {
  final int? campaignId;
  final double? totalRaised;
  final double? goalAmount;
  final double? progressPercentage;
  final int? totalContributions;
  final int? totalPledges;
  final double? totalPledgeAmount;
  final int? totalFulfilledPledges;
  final double? totalFulfilledPledgeAmount;
  final int? totalPendingPledges;
  final double? totalPendingPledgeAmount;
  final int? daysRemaining;
  final List<ContributionItem>? recentContributions;
  final List<PledgeItem>? recentPledges;
  String? error;

  FundraiserAnalytics(
      {this.campaignId,
      this.totalRaised,
      this.goalAmount,
      this.progressPercentage,
      this.totalContributions,
      this.totalPledges,
      this.totalPledgeAmount,
      this.totalFulfilledPledges,
      this.totalFulfilledPledgeAmount,
      this.totalPendingPledges,
      this.totalPendingPledgeAmount,
      this.daysRemaining,
      this.recentContributions,
      this.recentPledges,
      this.error});

  factory FundraiserAnalytics.fromJson(Map<String, dynamic> json) {
    var contributionsList = json['recent_contributions'] as List?;
    List<ContributionItem> recentContributionsList = contributionsList
            ?.map((i) => ContributionItem.fromJson(i as Map<String, dynamic>))
            .toList() ??
        [];

    var pledgesList = json['recent_pledges'] as List?;
    List<PledgeItem> recentPledgesList = pledgesList
            ?.map((i) => PledgeItem.fromJson(i as Map<String, dynamic>))
            .toList() ??
        [];

    return FundraiserAnalytics(
      campaignId: json['campaign_id'],
      totalRaised: (json['total_raised'] as num?)?.toDouble(),
      goalAmount: (json['goal_amount'] as num?)?.toDouble(),
      progressPercentage: (json['progress_percentage'] as num?)?.toDouble(),
      totalContributions: json['total_contributions'],
      totalPledges: json['total_pledges'],
      totalPledgeAmount: (json['total_pledge_amount'] as num?)?.toDouble(),
      totalFulfilledPledges: json['total_fulfilled_pledges'],
      totalFulfilledPledgeAmount: (json['total_fulfilled_pledge_amount'] as num?)?.toDouble(),
      totalPendingPledges: json['total_pending_pledges'],
      totalPendingPledgeAmount: (json['total_pending_pledge_amount'] as num?)?.toDouble(),
      daysRemaining: json['days_remaining'],
      recentContributions: recentContributionsList,
      recentPledges: recentPledgesList,
      error: json['errors'],
    );
  }
}

class PledgeItem {
  final double amount;
  final String? message;
  final String? paymentStatus;
  final String? referenceNumber;
  final DateTime? fulfillmentDeadline;
  final double amountPaid;
  final double amountRemaining;
  final DateTime? lastPaymentDate;
  final String? paymentMethod;
  final String? fulfillmentUrl;
  final int reminderSentCount;
  final DateTime? lastReminderSent;
  final int id;
  final int campaignId;
  final int? pledgerId;
  final String? pledgerName;
  final String? pledgerEmail;
  final String? pledgerPhone;
  final DateTime? pledgeDate;
  final bool isAnonymous;
  final String? status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  PledgeItem({
    required this.amount,
    this.message,
    this.paymentStatus,
    this.referenceNumber,
    this.fulfillmentDeadline,
    required this.amountPaid,
    required this.amountRemaining,
    this.lastPaymentDate,
    this.paymentMethod,
    this.fulfillmentUrl,
    required this.reminderSentCount,
    this.lastReminderSent,
    required this.id,
    required this.campaignId,
    this.pledgerId,
    this.pledgerName,
    this.pledgerEmail,
    this.pledgerPhone,
    this.pledgeDate,
    required this.isAnonymous,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory PledgeItem.fromJson(Map<String, dynamic> json) {
    return PledgeItem(
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      message: json['message'] as String?,
      paymentStatus: json['payment_status'] as String?,
      referenceNumber: json['reference_number'] as String?,
      fulfillmentDeadline: json['fulfillment_deadline'] == null
          ? null
          : DateTime.tryParse(json['fulfillment_deadline'] as String),
      amountPaid: (json['amount_paid'] as num?)?.toDouble() ?? 0.0,
      amountRemaining: (json['amount_remaining'] as num?)?.toDouble() ?? 0.0,
      lastPaymentDate: json['last_payment_date'] == null
          ? null
          : DateTime.tryParse(json['last_payment_date'] as String),
      paymentMethod: json['payment_method'] as String?,
      fulfillmentUrl: json['fulfillment_url'] as String?,
      reminderSentCount: json['reminder_sent_count'] as int? ?? 0,
      lastReminderSent: json['last_reminder_sent'] == null
          ? null
          : DateTime.tryParse(json['last_reminder_sent'] as String),
      id: json['id'] as int? ?? 0,
      campaignId: json['campaign_id'] as int? ?? 0,
      pledgerId: json['pledger_id'] as int?,
      pledgerName: json['pledger_name'] as String?,
      pledgerEmail: json['pledger_email'] as String?,
      pledgerPhone: json['pledger_phone'] as String?,
      pledgeDate: json['pledge_date'] == null
          ? null
          : DateTime.tryParse(json['pledge_date'] as String),
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      status: json['status'] as String?,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.tryParse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.tryParse(json['updated_at'] as String),
    );
  }
}

class ContributionItem {
  final double amount;
  final String? message;
  final bool isAnonymous;
  final int id;
  final int campaignId;
  final int?
      contributorId; // Nullable if contributor can be anonymous system-wise
  final String? contributorName;
  final String? contributorEmail;
  final String? contributorPhone;
  final int? walletId;
  final String? transferType;
  final DateTime? contributedAt;

  ContributionItem({
    required this.amount,
    this.message,
    required this.isAnonymous,
    required this.id,
    required this.campaignId,
    this.contributorId,
    this.contributorName,
    this.contributorEmail,
    this.contributorPhone,
    this.walletId,
    this.transferType,
    this.contributedAt,
  });

  factory ContributionItem.fromJson(Map<String, dynamic> json) {
    return ContributionItem(
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      message: json['message'] as String?,
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      id: json['id'] as int? ?? 0,
      campaignId: json['campaign_id'] as int? ?? 0,
      contributorId: json['contributor_id'] as int?,
      contributorName: json['contributor_name'] as String?,
      contributorEmail: json['contributor_email'] as String?,
      contributorPhone: json['contributor_phone'] as String?,
      walletId: json['wallet_id'] as int?,
      transferType: json['transfer_type'] as String?,
      contributedAt: json['contributed_at'] == null
          ? null
          : DateTime.tryParse(json['contributed_at'] as String),
    );
  }
}
