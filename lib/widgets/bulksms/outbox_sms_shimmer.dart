import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';
// Assuming your constants are in a reachable path
// import 'package:tuku/constants/constants.dart';

class OutboxSmsCardShimmer extends StatelessWidget {
  const OutboxSmsCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;
    final size = MediaQuery.of(context).size; // Get screen size for width consistency

    // Approximate text style heights for sizing shimmer boxes
    // Adjust these based on your actual font sizes and line heights for accuracy
    const double smallestBolderPoppinsHeight = 14.0;
    const double tinyPoppinsHintHeight = 12.0;
    const double smallestPoppinsHintHeight = 10.0; // For date
    const double tinyInterHeight = 12.0;         // For status

    // Use values from your constants if available, otherwise approximate
    // final EdgeInsets smallAllSidesPadding = Paddings.smallAllSides;
    const EdgeInsets smallAllSidesPadding = EdgeInsets.all(8.0); // Approximation
    // final EdgeInsets smallestVerticalMargin = Paddings.smallestVertical;
    // final double smallSideSpaceWidth = Spaces.smallSideSpace.width;
    const double smallSideSpaceWidth = 8.0; // Approximation

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        padding: smallAllSidesPadding,
        width: size.width, // Match original width
        margin: Paddings.smallestVertical,
        decoration: BoxDecoration(
          // color: Colors.white, // This will be overridden by shimmer, but good for structure
          // No need for specific border radius on the outer container for shimmer
          // unless your original white container itself has one.
        ),
        child: Row(
          children: [
            // 1. Shimmer for the status icon container
            Container(
              height: 45,
              width: 45,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: Colors.white, // This will be overridden by shimmer
              ),
              // No need to shimmer the Icon itself, the container is enough
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 2. Shimmer for the Expanded Column (phoneNumber, message)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shimmer for Phone Number
                  Container(
                    width: MediaQuery.of(context).size.width * 0.35, // Approx 35% width
                    height: smallestBolderPoppinsHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 4), // Spacing
                  // Shimmer for Message (single line for shimmer)
                  Container(
                    width: double.infinity, // Take full available width in Expanded
                    height: tinyPoppinsHintHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 3. Shimmer for the end Column (date, status text)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min, // Keep column tight
              children: [
                // Shimmer for Date
                Container(
                  width: 60, // Approximate width for a formatted date
                  height: smallestPoppinsHintHeight,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 4), // Spacing
                // Shimmer for Status Text
                Container(
                  width: 45, // Approximate width for "Success" or "Failed"
                  height: tinyInterHeight,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
