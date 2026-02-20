import 'package:tuku/models/models.dart';

class FavBanksResponse {
  final List<FullBank>? bankAccounts;
  final bool? hasMore;
  final int? page;
  final int? size;
  final int? total;
  final String? error;

  FavBanksResponse({
    this.bankAccounts,
    this.hasMore,
    this.page,
    this.size,
    this.total,
    this.error,
  });

  factory FavBanksResponse.fromJson(Map<String, dynamic> json) {
    var list = json['bank_accounts'] as List?;
    List<FullBank>? accountsList;
    if (list != null) {
      accountsList = list.map((i) => FullBank.fromJson(i)).toList();
    }

    return FavBanksResponse(
      bankAccounts: accountsList,
      hasMore: json['has_more'],
      page: json['page'],
      size: json['size'],
      total: json['total'],
      error: json['errors']
    );
  }
}

