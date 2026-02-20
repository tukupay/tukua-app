import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:hexcolor/hexcolor.dart'; // Assuming AppColors is here
import 'package:tuku/constants/constants.dart'; // Assuming Paddings, Spaces, Blacks, Greens are here


class LoadingPledgers extends StatelessWidget {
  final int index; // To maintain alternating background colors if desired

  const LoadingPledgers({super.key, required this.index});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final bool isEven = index % 2 == 0;
    final baseColor = isEven ? Colors.grey[300]! : Colors.grey[350]!;
    final highlightColor = isEven ? Colors.grey[100]! : Colors.grey[200]!;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        margin: Paddings.smallestVertical,
        child: Column(
          children: [
            Padding( // Added padding to match visual structure if original had implicit padding via margins
              padding: const EdgeInsets.all(8.0), // Adjust as needed
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Skeleton for Index Number (Optional, could be omitted for simplicity)
                  Container(
                    width: 25, // Approximate width for "1. "
                    height: 16, // Approximate height of the text
                    color: Colors.white, // This will be shimmered
                    margin: const EdgeInsets.only(top: 2), // Align with text
                  ),
                  Spaces.tinySideSpace,
                  // Skeleton for User Image
                  Container(
                    height: 50,
                    width: 50,
                    decoration: BoxDecoration(
                      color: Colors.white, // This will be shimmered
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  Spaces.tinySideSpace,
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Skeleton for Pledger Name
                        Container(
                          width: double.infinity,
                          height: 16, // Approximate height of the text
                          color: Colors.white,
                          margin: const EdgeInsets.only(bottom: 4),
                        ),
                        // Skeleton for Pledger Phone
                        Container(
                          width: 100, // Approximate width
                          height: 12, // Approximate height of the text
                          color: Colors.white,
                          margin: const EdgeInsets.only(bottom: 4),
                        ),
                        // Skeleton for Pledger Email
                        Container(
                          width: 150, // Approximate width
                          height: 10, // Approximate height of the text
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                  Spaces.tinySideSpace, // Added space before the amount column
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Skeleton for Amount
                      Container(
                        width: 80, // Approximate width
                        height: 16, // Approximate height of the text
                        color: Colors.white,
                        margin: const EdgeInsets.only(bottom: 4),
                      ),
                      // Skeleton for Amount Paid
                      Container(
                        width: 120, // Approximate width
                        height: 12, // Approximate height of the text
                        color: Colors.white,
                      ),
                    ],
                  )
                ],
              ),
            ),
            Spaces.tinyTopSpace,
            Padding( // Added padding to match visual structure
              padding: const EdgeInsets.symmetric(horizontal: 8.0), // Adjust as needed
              child: Row(
                children: [
                  Spaces.mediumSideSpace,
                  // Skeleton for Percentage Text
                  Container(
                    width: 30, // Approximate width for "50%"
                    height: 12, // Approximate height of the text
                    color: Colors.white,
                  ),
                  Spaces.smallSideSpace,
                  Expanded(
                      child: Container(
                        alignment: Alignment.centerLeft,
                        height: 12,
                        width: size.width,
                        decoration: BoxDecoration(
                            color: Colors.white, // This will be shimmered
                            borderRadius: BorderRadius.circular(8)),
                        // No need for FractionallySizedBox in skeleton,
                        // the container itself represents the progress bar track.
                      ))
                ],
              ),
            ),
            Spaces.tinyTopSpace
          ],
        ),
      ),
    );
  }
}
