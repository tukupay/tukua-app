import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';
// Assuming your constants are in a reachable path
// import 'package:tuku/constants/constants.dart'; // Make sure this path is correct

class BankAccountCardShimmer extends StatelessWidget {
  final int index; // To mimic the alternating background color if desired for shimmer

  const BankAccountCardShimmer({super.key, required this.index});

  @override
  Widget build(BuildContext context) {
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;

    // Decide shimmer's own background based on index, or use a neutral one
    // For shimmer, usually a single consistent background is fine,
    // as the content placeholders are what you focus on.
    // If you want to keep the alternating look:
    // final cardBgColorForShimmer = index % 2 == 0 ? Colors.white : HexColor('#FCF9E5');
    // However, the shimmer effect itself might obscure this subtly.
    // Let's use a consistent white for the shimmer's direct content background for clarity.
    // The baseColor of Shimmer.fromColors will be drawn over this anyway.
    final placeholderColor = shimmerBaseColor; // Key change for visibility

    // Approximate text style heights
    const double smallestPoppinsHintHeight = 10.0;
    const double tinySemiRobotoHeight = 10.0; // For "Active/Disabled"
    const double mediumSemiRubikHeight = 16.0;
    const double smallestBolderPoppinsHeight = 14.0;
    const double smallestBoldPoppinsHeight = 12.0; // For account number

    // Use values from your constants if available, otherwise approximate
    // final EdgeInsets smallestVerticalMargin = Paddings.smallestVertical;
    const EdgeInsets smallestVerticalMargin = EdgeInsets.symmetric(vertical: 8.0);
    // final EdgeInsets smallAllSidesPadding = Paddings.smallAllSides;
    const EdgeInsets smallAllSidesPadding = EdgeInsets.all(8.0);
    // final double smallSideSpaceWidth = Spaces.smallSideSpace.width;
    const double smallSideSpaceWidth = 8.0;
    // final EdgeInsets smallestAllSidesPaddingForStatus = Paddings.smallestAllSides;
    const EdgeInsets smallestAllSidesPaddingForStatus = EdgeInsets.all(2.0);


    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        margin: smallestVerticalMargin,
        decoration: BoxDecoration(
          // This background will be shown if the shimmer child is transparent
          // or before the shimmer effect fully covers it.
          // For shimmer effect to be visible ON these shapes, the shapes themselves
          // should have 'placeholderColor' (which is shimmerBaseColor).
          // color: index % 2 == 0 ? Colors.white : const Color(0xFFFCF9E5), // HexColor('#FCF9E5')
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: HexColor(AppColors.lightGray)
          ),
          boxShadow: [
            BoxShadow(
                offset: const Offset(0, 4),
                blurRadius: 10,
                spreadRadius: 0,
                color: Colors.black.withAlpha(25) // Keep shadows for card depth
            )
          ],
        ),
        padding: smallAllSidesPadding,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start, // Align columns at the top
          children: [
            // Left Column for Bank Details
            Expanded( // Give it space to expand before the right fixed-size box
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Row for Date and Status
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Shimmer for Date-Time Text
                      Container(
                        width: 100, // Approx width for "Date - Time"
                        height: smallestPoppinsHintHeight,
                        decoration: BoxDecoration(
                            color: placeholderColor,
                            borderRadius: BorderRadius.circular(4)),
                      ),
                      const SizedBox(width: smallSideSpaceWidth),
                      // Shimmer for Status Box
                      Container(
                        padding: smallestAllSidesPaddingForStatus,
                        decoration: BoxDecoration(
                          color: placeholderColor, // Placeholder for the status background
                          borderRadius: BorderRadius.circular(2), // Assuming small radius
                        ),
                        child: Container( // Inner container for text placeholder
                          width: 50, // Approx width for "Active" or "Disabled"
                          height: tinySemiRobotoHeight,
                          decoration: BoxDecoration(
                            color: placeholderColor, // This color should be the placeholder color
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6), // Spacing after date/status row

                  // Shimmer for Bank Name
                  Container(
                    width: double.infinity, // Takes available width
                    height: mediumSemiRubikHeight,
                    margin: const EdgeInsets.only(bottom: 4),
                    decoration: BoxDecoration(
                        color: placeholderColor,
                        borderRadius: BorderRadius.circular(4)),
                  ),

                  // Shimmer for Account Name
                  Container(
                    width: MediaQuery.of(context).size.width * 0.4, // Approx 40%
                    height: smallestBolderPoppinsHeight,
                    margin: const EdgeInsets.only(bottom: 4),
                    decoration: BoxDecoration(
                        color: placeholderColor,
                        borderRadius: BorderRadius.circular(4)),
                  ),

                  // Shimmer for Account Number
                  Container(
                    width: MediaQuery.of(context).size.width * 0.35, // Approx 35%
                    height: smallestBoldPoppinsHeight,
                    decoration: BoxDecoration(
                        color: placeholderColor,
                        borderRadius: BorderRadius.circular(4)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: smallSideSpaceWidth), // Space between left column and right box

            // Right Container for Initials
            Container(
              alignment: Alignment.center,
              height: 50,
              width: 80,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: placeholderColor // Placeholder for the initials box background
              ),
              // No need to shimmer the Text inside, the box is enough
            ),
          ],
        ),
      ),
    );
  }
}
