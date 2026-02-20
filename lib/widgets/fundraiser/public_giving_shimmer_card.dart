import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:shimmer/shimmer.dart';

import '../../constants/constants.dart';

/// Modern fintech-styled shimmer loading card for givings
/// Accurately matches the design of PublicGivingCard
class PublicGivingShimmerCard extends StatelessWidget {
  final int index;
  const PublicGivingShimmerCard({
    super.key,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final baseColor = Colors.grey[300]!;
    final highlightColor = Colors.grey[100]!;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: index % 2 == 0
                ? [Colors.white, HexColor('#FFF9F5')]
                : [Colors.white, HexColor('#F8FAF9')],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: HexColor('#E8ECE9'), width: 1),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Index badge skeleton with placeholder number appearance
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen).withAlpha(20),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Icon skeleton - shows actual icon shape
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                HugeIcons.strokeRoundedGift,
                color: HexColor(AppColors.primaryGreen).withAlpha(80),
                size: 18,
              ),
            ),
            const SizedBox(width: 12),

            // Details skeleton
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title line
                  Container(
                    height: 13,
                    width: 90,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Method chip skeleton
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: HexColor('#F0F4F3'),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 9,
                          height: 9,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 3),
                        Container(
                          width: 35,
                          height: 9,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Date line
                  Row(
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedCalendar03,
                        size: 11,
                        color: HexColor(AppColors.darkerGray2).withAlpha(60),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        width: 30,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Amount skeleton
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  height: 14,
                  width: 65,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                // Success badge skeleton
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: HexColor('#E8F5E9').withAlpha(150),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Container(
                    width: 40,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
