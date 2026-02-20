class PledgeResponse {
   double? amount;
   String? message;
   String? paymentStatus;
   String? referenceNumber;
   DateTime? fulfillmentDeadline;
   double? amountPaid;
   double? amountRemaining;
   DateTime? lastPaymentDate;
   String? paymentMethod;
   String? fulfillmentUrl;
   int? reminderSentCount;
   DateTime? lastReminderSent;
   int? id;
   int? campaignId;
   int? pledgerId;
   String? pledgerName;
   String? pledgerEmail;
   String? pledgerPhone;
   DateTime? pledgeDate;
   bool? isAnonymous;
   String? status;
   DateTime? createdAt;
   DateTime? updatedAt;
   String? error;

  PledgeResponse({
    this.amount,
    this.message,
    this.paymentStatus,
    this.referenceNumber,
    this.fulfillmentDeadline,
    this.amountPaid,
    this.amountRemaining,
    this.lastPaymentDate,
    this.paymentMethod,
    this.fulfillmentUrl,
    this.reminderSentCount,
    this.lastReminderSent,
    this.id,
    this.campaignId,
    this.pledgerId,
    this.pledgerName,
    this.pledgerEmail,
    this.pledgerPhone,
    this.pledgeDate,
    this.isAnonymous,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.error,
  });

  factory PledgeResponse.fromJson(Map<String, dynamic> json) {
    return PledgeResponse(
      amount: json['amount']?.toDouble(),
      message: json['message'],
      paymentStatus: json['payment_status'],
      referenceNumber: json['reference_number'],
      fulfillmentDeadline: json['fulfillment_deadline'] != null
          ? DateTime.parse(json['fulfillment_deadline'])
          : null,
      amountPaid: json['amount_paid']?.toDouble(),
      amountRemaining: json['amount_remaining']?.toDouble(),
      lastPaymentDate: json['last_payment_date'] != null
          ? DateTime.parse(json['last_payment_date'])
          : null,
      paymentMethod: json['payment_method'],
      fulfillmentUrl: json['fulfillment_url'],
      reminderSentCount: json['reminder_sent_count'],
      lastReminderSent: json['last_reminder_sent'] != null
          ? DateTime.parse(json['last_reminder_sent'])
          : null,
      id: json['id'],
      campaignId: json['campaign_id'],
      pledgerId: json['pledger_id'],
      pledgerName: json['pledger_name'],
      pledgerEmail: json['pledger_email'],
      pledgerPhone: json['pledger_phone'],
      pledgeDate: json['pledge_date'] != null
          ? DateTime.parse(json['pledge_date'])
          : null,
      isAnonymous: json['is_anonymous'],
      status: json['status'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      error: json['errors'],
    );
  }
}
