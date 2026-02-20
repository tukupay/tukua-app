import '../models.dart';

class FullWallet {
  int? appId;
  double? autoSettlementAmount;
  double? autoSettlementThreshold;
  double? balance;
  String? bank;
  int? bankAccountId;
  CoopWallet? coopWallet;
  DateTime? createdAt;
  String? currency;
  int? id;
  String? alias;
  bool? isActive;
  bool? isPrimary;
  bool? isTukuWallet;
  bool? isLinkedToBank;
  double? lastSettlementAmount;
  DateTime? lastSettlementDate;
  String? name;
  String? purposeTag;
  String? settlementType;
  List<WalletSignatory>? signatories;
  int? signatoriesCount;
  double? totalSettledAmount;
  DateTime? updatedAt;
  int? userId;
  String? walletType;
  int? typeId;
  String? walletTypeInfo;
  BankAccount? bankAccount;
  String? error;
  String? color; // legacy (comma separated hex string)
  List<String>? colors; // preferred - array of hex strings

  FullWallet(
      {this.appId,
        this.autoSettlementAmount,
        this.autoSettlementThreshold,
        this.balance,
        this.bank,
        this.bankAccountId,
        this.coopWallet,
        this.createdAt,
        this.currency,
        this.id,
        this.alias,
        this.isActive,
        this.isPrimary,
        this.isTukuWallet,
        this.isLinkedToBank,
        this.lastSettlementAmount,
        this.lastSettlementDate,
        this.name,
        this.purposeTag,
        this.settlementType,
        this.signatories,
        this.signatoriesCount,
        this.totalSettledAmount,
        this.updatedAt,
        this.userId,
        this.walletType,
        this.typeId,
        this.walletTypeInfo,
        this.bankAccount,
        this.color,
        this.colors,
        this.error});

  factory FullWallet.fromJson(Map<String, dynamic> json) {
    var signatoriesList = json['signatories'] as List?;
    List<WalletSignatory>? parsedSignatories;
    if (signatoriesList != null) {
      parsedSignatories =
          signatoriesList.map((i) => WalletSignatory.fromJson(i)).toList();
    }

    return FullWallet(
        appId: json['app_id'],
        autoSettlementAmount: (json['auto_settlement_amount'])?.toDouble(),
        autoSettlementThreshold:
        (json['auto_settlement_threshold'])?.toDouble(),
        balance: (json['balance'])?.toDouble(),
        bank: json['bank'],
        bankAccountId: json['bank_account_id'],
        coopWallet: json['coop_wallet'] != null
            ? CoopWallet.fromJson(json['coop_wallet'])
            : null,
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'])
            : null,
        currency: json['currency'],
        id: json['id'],
        alias: json['alias'],
        isActive: json['is_active'],
        isPrimary: json['is_primary'],
        isTukuWallet: json['is_tukupay_wallet'],
        isLinkedToBank: json['is_linked_to_bank'],
        lastSettlementAmount: (json['last_settlement_amount'])?.toDouble(),
        lastSettlementDate: json['last_settlement_date'] != null
            ? DateTime.parse(json['last_settlement_date'])
            : null,
        name: json['name'],
        purposeTag: json['purpose_tag'],
        settlementType: json['settlement_type'],
        signatories: parsedSignatories,
        signatoriesCount: json['signatories_count'],
        totalSettledAmount: (json['total_settled_amount'])?.toDouble(),
        updatedAt: json['updated_at'] != null
            ? DateTime.parse(json['updated_at'])
            : null,
        userId: json['user_id'],
        walletType: json['wallet_type'],
        typeId: json['type_id'],
        walletTypeInfo: json['wallet_type_info'],
        bankAccount: json['bank_account'] != null
            ? BankAccount.fromJson(json['bank_account'])
            : null,
        error: json['errors']);
  }
}
