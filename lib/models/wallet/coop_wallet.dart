class CoopWallet {
  String? accountId;
  String? accountNumber;
  String? customerNumber;
  String? messageReference;
  String? walletType;
  String? purposeTag;
  String? alias;
  int? walletId;
  DateTime? createdAt;
  DateTime? updatedAt;

  CoopWallet({
    this.accountId,
    this.accountNumber,
    this.customerNumber,
    this.messageReference,
    this.walletType,
    this.purposeTag,
    this.alias,
    required this.walletId,
    this.createdAt,
    this.updatedAt,
  });

  factory CoopWallet.fromJson(Map<String, dynamic> json) {
    return CoopWallet(
      accountId: json['account_id'],
      accountNumber: json['account_number'],
      customerNumber: json['customer_number'],
      alias: json['alias'],
      walletId: json['wallet_id'],
      messageReference: json['message_reference'],
      walletType: json['wallet_type'],
      purposeTag: json['purpose_tag'],
    );
  }

}
