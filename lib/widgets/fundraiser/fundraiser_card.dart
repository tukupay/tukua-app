import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/utils/cached_auth_image_provider.dart';

class FundraiserCard extends StatelessWidget {
  final FundraiserResponse fundraiser;
  const FundraiserCard({super.key, required this.fundraiser});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final progress = (fundraiser.amountRaised! / fundraiser.goalAmount! * 100).clamp(0, 100);

    return GestureDetector(
      onTap: () {
        Provider.of<FundraiserProvider>(context, listen: false).selectFundraiser(fundraiser);
        Navigator.pushNamed(context, Routes.fundraiserDetails);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        width: size.width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: HexColor(AppColors.primaryGreen).withAlpha(30), width: 1),
          boxShadow: [
            BoxShadow(
              offset: const Offset(0, 8),
              blurRadius: 24,
              spreadRadius: -4,
              color: HexColor(AppColors.primaryGreen).withAlpha(20),
            ),
            BoxShadow(
              offset: const Offset(0, 2),
              blurRadius: 4,
              color: Colors.black.withAlpha(8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Image Section
            Container(
              height: 180,
              width: size.width,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                image: DecorationImage(
                  image: fundraiser.coverPhotoUrl != null
                      ? CachedAuthImageProvider(fundraiser.coverPhotoUrl!)
                      : AssetImage(Strings.sampleImageAsset('donate.jpg')) as ImageProvider,
                  fit: BoxFit.cover,
                ),
              ),
              child: Stack(
                children: [
                  // Gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withAlpha(150),
                        ],
                      ),
                    ),
                  ),
                  // Target amount glass card
                  Positioned(
                    top: 12,
                    left: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(220),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withAlpha(150)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Target', style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: HexColor(AppColors.darkerGray2),
                              )),
                              const SizedBox(height: 2),
                              Text(
                                'KES ${formatThousands(amount: fundraiser.goalAmount!, noDecimal: true)}',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: HexColor(AppColors.primaryGreen),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Status badge
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: _getStatusColor(fundraiser.status),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getStatusIcon(fundraiser.status),
                            size: 12,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            fundraiser.status?.toUpperCase() ?? 'ACTIVE',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Progress percentage
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${progress.toInt()}%',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Content Section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and category
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              fundraiser.title!,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryGreen).withAlpha(20),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.verified,
                                    size: 12,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    fundraiser.category!,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: HexColor(AppColors.primaryGreen),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Progress bar
                  Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildAmountLabel(
                            'Raised',
                            formatThousands(amount: fundraiser.amountRaised!, noDecimal: true),
                            HexColor(AppColors.primaryGreen),
                          ),
                          _buildAmountLabel(
                            'Goal',
                            formatThousands(amount: fundraiser.goalAmount!, noDecimal: true),
                            HexColor(AppColors.darkerGray2),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 8,
                        width: size.width,
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.lightestGray),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: (progress / 100).clamp(0.0, 1.0),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  HexColor(AppColors.primaryGreen),
                                  HexColor(AppColors.brightGreen),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Owner info and date
                  Consumer<ProfileProvider>(
                    builder: (_, profile, __) {
                      return Row(
                        children: [
                          Container(
                            height: 36,
                            width: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: HexColor(AppColors.primaryGreen).withAlpha(50),
                                width: 2,
                              ),
                              image: DecorationImage(
                                image: profile.user?.profileImg == null
                                    ? AssetImage(Strings.imageAsset('user.jpeg'))
                                    : CachedAuthImageProvider(profile.user!.profileImg!) as ImageProvider,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.user?.type == Strings.individualAcc
                                      ? '${profile.user?.firstName ?? ''} ${profile.user?.lastName ?? ''}'
                                      : profile.user?.businessName ?? '',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                                Text(
                                  DateFormat('MMM d, yyyy').format(fundraiser.createdAt!),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: HexColor(AppColors.darkerGray2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Copy link button
                          GestureDetector(
                            onTap: () async {
                              await Clipboard.setData(ClipboardData(
                                text: fundraiser.publicUrl ?? fundraiser.checkoutLink!,
                              ));
                              Fluttertoast.cancel();
                              Fluttertoast.showToast(msg: "Link copied!");
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: HexColor(AppColors.primaryGreen).withAlpha(15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: HexColor(AppColors.primaryGreen).withAlpha(30),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    HugeIcons.strokeRoundedCopy01,
                                    size: 14,
                                    color: HexColor(AppColors.primaryGreen),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Copy Link',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: HexColor(AppColors.primaryGreen),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountLabel(String label, String amount, Color color) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: HexColor(AppColors.darkerGray2),
          ),
        ),
        Text(
          'KES $amount',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return HexColor(AppColors.primaryGreen);
      case 'completed':
        return HexColor(AppColors.brightGreen);
      case 'cancelled':
        return HexColor(AppColors.red);
      case 'inactive':
        return HexColor(AppColors.darkerGray2);
      default:
        return HexColor(AppColors.primaryGreen);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return HugeIcons.strokeRoundedActivity01;
      case 'completed':
        return HugeIcons.strokeRoundedCheckmarkCircle02;
      case 'cancelled':
        return HugeIcons.strokeRoundedCancel01;
      case 'inactive':
        return HugeIcons.strokeRoundedPause;
      default:
        return HugeIcons.strokeRoundedActivity01;
    }
  }
}
