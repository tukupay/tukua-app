import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

class ExploreFundraiserCard extends StatelessWidget {
  final int index;
  final FundraiserResponse fundraiser;
  const ExploreFundraiserCard({
    super.key,
    required this.index,
    required this.fundraiser,
  });

  @override
  Widget build(BuildContext context) {
    final progress = (fundraiser.amountRaised! / fundraiser.goalAmount! * 100).clamp(0, 100);

    return GestureDetector(
      onTap: () {
        Provider.of<FundraiserProvider>(context, listen: false).selectFundraiser(fundraiser);
        Navigator.pushNamed(context, Routes.publicFundraiserDetails);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: HexColor(AppColors.lightestGray)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Index badge
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withAlpha(20),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: HexColor(AppColors.primaryGreen),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Cover image with progress overlay
            Stack(
              children: [
                Container(
                  height: 60,
                  width: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    image: DecorationImage(
                      image: fundraiser.coverPhotoUrl == null
                          ? AssetImage(Strings.sampleImageAsset('donate.jpg'))
                          : NetworkImage(fundraiser.coverPhotoUrl!) as ImageProvider,
                      fit: BoxFit.cover,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(20),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen),
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                    ),
                    child: Text(
                      '${progress.toInt()}%',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fundraiser.title!,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryGreen).withAlpha(15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.verified,
                              size: 10,
                              color: HexColor(AppColors.primaryGreen),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              fundraiser.category ?? '',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: HexColor(AppColors.primaryGreen),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Progress bar
                  Container(
                    height: 6,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.lightestGray),
                      borderRadius: BorderRadius.circular(3),
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
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Amount info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'KES ${formatThousands(amount: fundraiser.amountRaised!, noDecimal: true)}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: HexColor(AppColors.primaryGreen),
                        ),
                      ),
                      Text(
                        'of ${formatThousands(amount: fundraiser.goalAmount!, noDecimal: true)}',
                        style: TextStyle(
                          fontSize: 10,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Arrow icon
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: HexColor(AppColors.lightestGray).withAlpha(100),
                shape: BoxShape.circle,
              ),
              child: Icon(
                HugeIcons.strokeRoundedArrowRight01,
                size: 16,
                color: HexColor(AppColors.darkerGray2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
