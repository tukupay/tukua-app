import 'dart:convert';
import '../models.dart';
class WalletRequest{

  int userId;
  String? name;
  String? currency;
  int? typeId;
  String? bank;
  int? bankAccId;
  List<Signatory>? signatories;
  double? autoSettlementAmount;
  double? autoSettlementThreshold;
  String? settlementType;

  WalletRequest({
    required this.userId,
    this.currency,
    required this.name,
    this.typeId,
    this.bank,
    this.bankAccId,
    this.signatories,
    this.autoSettlementAmount,
    this.autoSettlementThreshold,
    this.settlementType,
});
  factory WalletRequest.fromJson(Map<String, dynamic> json) {
    var signatoriesList = json['signatories'];
    List<Signatory>? signatories;
    if (signatoriesList != null) {
      signatories = signatoriesList.map((i) => Signatory.fromJson(i)).toList();
    }

    return WalletRequest(
      userId: json['user_id'],
      name: json['name'],
      currency: json['currency'],
      typeId: json['type_id'],
      bankAccId: json['bank_account_id'],
      signatories: signatories,
      bank: json['bank'],
      autoSettlementAmount: json['auto_settlement_amount'],
      autoSettlementThreshold: json['auto_settlement_threshold'],
      settlementType: json['settlement_type'],
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'user_id': userId,
      'name': name
    };
    if (currency != null) {
      data['currency'] = currency;
    }
    if (typeId != null) {
      data['type_id'] = typeId;
    }
    if (bankAccId != null) {
      data['bank_account_id'] = bankAccId;
    }
    if (signatories != null) {
      data['signatories'] = signatories!.map((v) => v.toJson()).toList();
    }
    if (bank != null) {
      data['bank'] = bank;
    }
    if(autoSettlementAmount!=null){
      data['auto_settlement_amount']=autoSettlementAmount;
    }
    if(autoSettlementThreshold!=null){
      data['auto_settlement_threshold']=autoSettlementThreshold;
    }
    if(settlementType!=null){
      data['settlement_type']=settlementType;
    }
    return data;
  }
}