import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';

class ContactCardShimmer extends StatelessWidget {
  const ContactCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    // Define shimmer gradient colors
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;

    // Approximate text style heights for sizing shimmer boxes
    // You might need to adjust these based on your actual font sizes and line heights
    const double regularBoldCodeNextHeight = 18.0;
    const double regularSemiRobotoHeight = 16.0;
    const double tinyPoppinsHintHeight = 12.0;
    const double tinyPoppinsSelectHeight = 12.0;

    // Use values from your constants if available, otherwise approximate
    // final EdgeInsets tinyVerticalPadding = Paddings.tinyVertical; // Example
    const EdgeInsets tinyVerticalPadding = EdgeInsets.symmetric(vertical: 2.0); // Approximation
    // final double smallSideSpaceWidth = Spaces.smallSideSpace.width; // Example
    const double smallSideSpaceWidth = 8.0; // Approximation

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        // The original container has a red background for debugging,
        // the shimmer itself doesn't need it.
        // color: Colors.red, // Not needed for shimmer
        padding: tinyVerticalPadding,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Shimmer for the number Text (e.g., '1.')
            Container(
              width: 25, // Approximate width for "XX."
              height: regularBoldCodeNextHeight,
              decoration: BoxDecoration(
                color: Colors.white, // This will be overridden by shimmer
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 2. Shimmer for the circular image avatar
            Container(
              height: 50,
              width: 50,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white, // This will be overridden by shimmer
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth),

            // 3. Shimmer for the Expanded Column of text (name, phone)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shimmer for Name
                  Container(
                    width: double.infinity,
                    height: regularSemiRobotoHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 4), // Small spacing between name and phone
                  // Shimmer for Phone
                  Container(
                    // Take about 60-70% of the available width for the phone number
                    width: MediaQuery.of(context).size.width * 0.35,
                    height: tinyPoppinsHintHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),

            Spaces.mediumSideSpace,
            // 4. Shimmer for the "Select" Text and Checkbox
            // We can approximate this area with a couple of small shimmer blocks
            Container(
              width: 24, // Approximate size of a checkbox
              height: 24,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4), // Or make it circular if preferred
              ),
            ),
          ],
        ),
      ),
    );
  }
}
