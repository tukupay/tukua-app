class PaginatedFundraisersResponse {
  final List<FundraiserResponse>? campaigns;
  final int? total;
  final int? size;
  final int? page;
  final bool? hasMore;
  final String? error;

  PaginatedFundraisersResponse({
    this.campaigns,
    this.total,
    this.size,
    this.page,
    this.hasMore,
    this.error,
  });

  factory PaginatedFundraisersResponse.fromJson(Map<String, dynamic> json) {
    var list = json['campaigns'] as List?;
    List<FundraiserResponse>? campaignsList;
    if (list != null) {
      campaignsList = list.map((i) => FundraiserResponse.fromJson(i)).toList();
    }

    return PaginatedFundraisersResponse(
      campaigns: campaignsList,
      total: json['total'],
      size: json['size'],
      page: json['page'],
      hasMore: json['has_more'],
      error: json['errors'],
    );
  }
}

class FundraiserResponse {
  String? title;
  String? category;
  String? description;
  String? coverPhotoUrl;
  List<String>? otherImageUrls;
  double? goalAmount;
  DateTime? startDate;
  DateTime? endDate;
  bool? analyticsPublic;
  bool? isPublic;
  bool? allowPledges;
  int? id;
  int? ownerId;
  int? walletId;
  double? amountRaised;
  String? checkoutLink;
  String? publicUrl;
  String? analyticsUrl;
  String? status;
  DateTime? createdAt;
  DateTime? updatedAt;
  int? contributionsCount;
  Owner? owner;
  Owner? ownerData;
  String? error;

  FundraiserResponse({
    this.title,
    this.category,
    this.description,
    this.coverPhotoUrl,
    this.otherImageUrls,
    this.goalAmount,
    this.startDate,
    this.endDate,
    this.analyticsPublic,
    this.isPublic,
    this.allowPledges,
    this.id,
    this.ownerId,
    this.walletId,
    this.amountRaised,
    this.checkoutLink,
    this.publicUrl,
    this.analyticsUrl,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.contributionsCount,
    this.owner,
    this.ownerData,
    this.error});

  // Helper getter to check if fundraiser is active
  bool get isActive => status == 'active';

  factory FundraiserResponse.fromJson(Map<String, dynamic> json) {
    return FundraiserResponse(
        title: json['title'],
        category: json['category'],
        description: json['description'],
        coverPhotoUrl: json['cover_photo'],
        otherImageUrls: json['other_images'] != null
            ? List<String>.from(json['other_images'] as List<dynamic>)
            : null,
        goalAmount: (json['goal_amount'] as num?)?.toDouble(),
        startDate:
            json['start_date'] != null ? DateTime.parse(json['start_date']) : null,
        endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
        analyticsPublic: json['analytics_public'],
        isPublic: json['is_public'],
        allowPledges: json['allow_pledges'],
        id: json['id'],
        ownerId: json['owner_id'],
        walletId: json['wallet_id'],
        amountRaised: (json['amount_raised'] as num?)?.toDouble(),
        checkoutLink: json['checkout_link'],
        publicUrl: json['public_html_url'],
        analyticsUrl: json['analytics_public_url'],
        status: json['status'],
        createdAt:
            json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
        updatedAt:
            json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
        contributionsCount: json['contributions_count'],
        owner: json['owner'] != null ? Owner.fromJson(json['owner']) : null,
        ownerData: json['owner_data'] != null ? Owner.fromJson(json['owner_data']) : null,
        error: json['errors']);
  }
}

class Owner {
  final String? type;
  final String? firstName;
  final String? lastName;
  final String? fullName;
  final String? title;
  final String? businessName;
  final String? businessType;
  final String? profileImageUrl;

  Owner({
    this.type,
    this.firstName,
    this.lastName,
    this.fullName,
    this.title,
    this.businessName,
    this.businessType,
    this.profileImageUrl,
  });

  factory Owner.fromJson(Map<String, dynamic> json) {
    return Owner(
      type: json['type'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      fullName: json['full_name'],
      title: json['title'],
      businessName: json['business_name'],
      businessType: json['business_type'],
      profileImageUrl: json['profile_image_url'],
    );
  }
}
