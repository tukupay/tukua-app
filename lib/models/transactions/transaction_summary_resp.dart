import 'package:tuku/models/models.dart';

class TransactionSummaryResp{
  TransactionSummary? summary;
  String? error;

  TransactionSummaryResp({this.summary,this.error});

  factory TransactionSummaryResp.fromJson(Map<String,dynamic>json){
    return TransactionSummaryResp(
      summary: json['errors']==null?TransactionSummary.fromJson(json):null,
      error: json['errors'],
    );
  }

}