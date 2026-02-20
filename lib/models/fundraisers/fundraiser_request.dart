import 'dart:io';
class FundraiserRequest {
   String title;
   String category;
   String description;
   File coverPhoto;
  List<File>? otherImages;
   double goalAmount;
   DateTime startDate;
   DateTime endDate;
   bool allowPledges;
   int walletId;
   bool analyticsPublic;
   bool isPublic;

  FundraiserRequest({
    required this.title,
    required this.category,
    required this.description,
    required this.coverPhoto,
    this.otherImages,
    required this.goalAmount,
    required this.startDate,
    required this.endDate,
    required this.allowPledges,
    required this.walletId,
    required this.analyticsPublic,
    required this.isPublic,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'category': category,
      'description': description,
      // Files are not typically part of a simple JSON representation like this.
      // They are added separately in a multipart request.
      'cover_photo': coverPhoto.path, // For logging or simple info
      'other_images': otherImages?.map((file) => file.path).toList(), // For logging
      'goal_amount': goalAmount,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
      'wallet_id': walletId,
      'analytics_public': analyticsPublic,
      'is_public': isPublic,
      "allow_pledges": allowPledges,
    };
  }
}


