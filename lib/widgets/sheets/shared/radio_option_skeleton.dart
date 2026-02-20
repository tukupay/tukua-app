import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:hexcolor/hexcolor.dart'; // Assuming AppColors and HexColor are here
import 'package:tuku/constants/constants.dart'; // Assuming Paddings, Spaces, Blacks, Grays etc.

// Placeholder for AppColors if not in constants.dart
// class AppColors {
//   static String primaryOrange = '#EE7D13';
//   static String lightBorderGray = '#E4E4E4';
// }

class RadioOptionSkeleton extends StatelessWidget {
  final int items;
  const RadioOptionSkeleton({super.key,this.items=4});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final baseColor = Colors.grey[300]!; // Shimmer base color
    final highlightColor = Colors.grey[100]!; // Shimmer highlight color

    return ListView.builder(
      shrinkWrap: true,
      itemCount: items,
      itemBuilder: (context,index) {
        return Shimmer.fromColors(
          baseColor: baseColor,
          highlightColor: highlightColor,
          child: Container(
            margin: Paddings.smallestAllSides,
            width: size.width,
            padding: Paddings.smallestAllSides,
            decoration: BoxDecoration(
              // color: Colors.white, // Background for the shimmer placeholders
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: HexColor(AppColors.lightGray), // Use a light gray for skeleton border
                width: 2,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center, // Align items vertically
              children: [
                // Skeleton for the Icon container
                Container(
                  height: 56,
                  width: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    color: Colors.white, // This will be shimmered
                    border: Border.all(
                      color: Colors.transparent, // No specific border color needed for skeleton inner box
                      width: 1,
                    ),
                  ),
                  // You could add an inner slightly smaller box if the double border look is important
                  // child: Center(
                  //   child: Container(
                  //     height: 46,
                  //     width: 46,
                  //     color: Colors.white, // This will be shimmered (inner part of icon)
                  //   ),
                  // ),
                ),
                Spaces.smallSideSpace,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Skeleton for option.name
                      Container(
                        width: size.width * 0.4, // Approximate width
                        height: 18, // Approximate height for Blacks.regularSemiRoboto
                        color: Colors.white, // This will be shimmered
                        margin: const EdgeInsets.only(bottom: 6), // Spacing between lines
                      ),
                      // Skeleton for option.description
                      Container(
                        width: size.width * 0.5, // Approximate width
                        height: 14, // Approximate height for Grays.tinyPoppinsHint
                        color: Colors.white, // This will be shimmered
                      ),
                    ],
                  ),
                ),
                // Skeleton for Radio button
                Container(
                  height: 24, // Approximate height of a Radio button's touch target
                  width: 24,  // Approximate width
                  decoration: BoxDecoration(
                    color: Colors.white, // This will be shimmered
                    shape: BoxShape.circle, // Radio buttons are circular
                  ),
                  margin: const EdgeInsets.only(left: 8), // Mimic Radio padding
                ),
              ],
            ),
          ),
        );
      }
    );
  }
}
