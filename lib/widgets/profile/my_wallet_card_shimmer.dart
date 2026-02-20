import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
// Assuming your constants are in a reachable path
// import 'package:tuku/constants/constants.dart'; // Make sure this path is correct

class MyWalletCardShimmer extends StatelessWidget {
  final int index;
  final Size size; // Pass screen size for width consistency

  const MyWalletCardShimmer({
    super.key,
    required this.index,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;
    final placeholderColor = shimmerBaseColor; // For the actual shimmer shapes

    // Approximate text style heights
    const double tinyRobotoHeight = 10.0;
    const double smallestBoldPoppinsHeight = 12.0;
    const double tinyPoppinsHintHeight = 10.0;
    const double tinyPoppinsOrangeHeight = 10.0;

    // Use values from your constants if available, otherwise approximate
    // final EdgeInsets tinyAllSidesPadding = Paddings.tinyAllSides;
    const EdgeInsets tinyAllSidesPadding = EdgeInsets.all(4.0);
    // final EdgeInsets tinyVerticalMargin = Paddings.tinyVertical;
    const EdgeInsets tinyVerticalMargin = EdgeInsets.symmetric(vertical: 6.0);
    // final double smallSideSpaceWidth = Spaces.smallSideSpace.width;
    const double smallSideSpaceWidth = 8.0;
    // final double tinyTopSpaceHeight = Spaces.tinyTopSpace.height;
    const double tinyTopSpaceHeight = 4.0;
    // final Color borderColor = HexColor('#E4E4E4');
    const Color borderColor = Color(0xFFE4E4E4); // Approximation

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        padding: tinyAllSidesPadding,
        margin: tinyVerticalMargin,
        decoration: BoxDecoration(
          // color: index % 2 == 0 ? Colors.white : const Color(0xFFFCF9E5), // HexColor('#FCF9E5')
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: borderColor,
          ),
        ),
        height: 97, // Keep fixed height
        width: size.width, // Keep fixed width
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Shimmer for the Initials Box
            Container(
              alignment: Alignment.center,
              height: 55,
              width: 55,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: placeholderColor, // Use placeholderColor
              ),
              // No need to shimmer Text inside
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 2. Shimmer for the Expanded Column of details
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // First Row (Wallet Name, Account Number)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Shimmer for Wallet Name
                      Container(
                        width: size.width * 0.25, // Approx 25% of card width
                        height: tinyRobotoHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                      // Shimmer for Account Number
                      Container(
                        width: size.width * 0.3, // Approx 30% of card width
                        height: smallestBoldPoppinsHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                    ],
                  ),
                  const SizedBox(height: tinyTopSpaceHeight),

                  // Second Row (Available Balance label, Amount)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Shimmer for 'Available balance'
                      Container(
                        width: size.width * 0.3, // Approx 30%
                        height: tinyPoppinsHintHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                      // Shimmer for Amount
                      Container(
                        width: size.width * 0.2, // Approx 20%
                        height: tinyPoppinsOrangeHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                    ],
                  ),
                  const SizedBox(height: tinyTopSpaceHeight),

                  // Third Row (Purpose label, Purpose text)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Shimmer for 'Purpose'
                      Container(
                        width: size.width * 0.2, // Approx 20%
                        height: tinyPoppinsHintHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                      // Shimmer for Purpose Text
                      Container(
                        width: size.width * 0.25, // Approx 25%
                        height: tinyPoppinsOrangeHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(3)),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
