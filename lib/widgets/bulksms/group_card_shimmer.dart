import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';
// Assuming your constants are in a reachable path
// import 'package:tuku/constants/constants.dart';

class GroupCardShimmer extends StatelessWidget {
  const GroupCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;

    // Approximate text style heights for sizing shimmer boxes
    // Adjust these based on your actual font sizes and line heights for accuracy
    const double regularBoldCodeNextHeight = 18.0;
    const double regularSemiRobotoHeight = 16.0;
    const double tinyPoppinsHintHeight = 12.0;
    const double smallestBoldPoppinsHeight = 10.0;
    const double underlinedSmallSemiKarlaHeight = 12.0;

    // Use values from your constants if available, otherwise approximate
    // final EdgeInsets tinyVerticalPadding = Paddings.tinyVertical;
    const EdgeInsets tinyVerticalPadding = EdgeInsets.symmetric(vertical: 2.0); // Approximation
    // final double smallSideSpaceWidth = Spaces.smallSideSpace.width;
    const double smallSideSpaceWidth = 8.0; // Approximation

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        margin: Paddings.smallestVertical,
        padding: tinyVerticalPadding,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center, // Keep this if it's important for centering the shimmer
          crossAxisAlignment: CrossAxisAlignment.start, // Align items to the start for column content
          children: [
            // 1. Shimmer for the number Text (e.g., '1.')
            Container(
              width: 25, // Approximate width for "XX."
              height: regularBoldCodeNextHeight,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 2. Shimmer for the circular avatar
            // The original has text inside, but for shimmer, a simple circle is enough.
            Container(
              height: 50,
              width: 50,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 3. Shimmer for the Expanded Column of group details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shimmer for Group Name
                  Container(
                    width: double.infinity,
                    height: regularSemiRobotoHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 4), // Spacing
                  // Shimmer for Members Count
                  Container(
                    width: MediaQuery.of(context).size.width * 0.3, // Approx 30% width
                    height: tinyPoppinsHintHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Shimmer for Description (single line for shimmer)
                  Container(
                    width: MediaQuery.of(context).size.width * 0.45, // Approx 45% width
                    height: smallestBoldPoppinsHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 4. Shimmer for the Column with Checkbox and "View" Text
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center, // Center these items
              children: [
                // Shimmer for Checkbox
                Container(
                  width: 20, // Approximate size of compact checkbox
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(3), // Slightly rounded square
                  ),
                ),
                const SizedBox(height: 6), // Spacing between checkbox and "View"
                // Shimmer for "View" Text
                Container(
                  width: 35, // Approximate width for "View"
                  height: underlinedSmallSemiKarlaHeight,
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
