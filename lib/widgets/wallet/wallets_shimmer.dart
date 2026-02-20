import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/app_colors.dart'; // Only if you use it for the shimmer's solid base

// If you have a central 'Spaces' definition and want to use it for consistency:
// import 'package:tuku/constants/constants.dart'; // Or wherever Spaces is defined

class WalletsShimmer extends StatelessWidget {
  final Size size; // MediaQuery size passed from the parent

  const WalletsShimmer({super.key, required this.size});

  Widget _buildPlaceholder({
    required double height,
    required double width,
    Color color = Colors.white, // Default placeholder color within the shimmer
    BoxShape shape = BoxShape.rectangle,
    BorderRadius? borderRadius,
  }) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: color.withOpacity(0.5), // Make it semi-transparent for shimmer
        shape: shape,
        borderRadius: shape == BoxShape.rectangle ? borderRadius : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Color shimmerBaseColor = Colors.grey[700]!; // Darker base for a green gradient card
    final Color shimmerHighlightColor = Colors.grey[500]!; // Lighter highlight

    // Approximate constants from your Spaces if not importing
    const double tinySpace = 4.0;
    const double smallSpace = 8.0;
    // const double mediumSpace = 16.0;

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      period: const Duration(milliseconds: 1200),
      child: Container(
        margin: const EdgeInsets.only(left: 4, right: 4), // Ensure consistency
        height: 155,
        width: size.width, // Use the passed size
        decoration: BoxDecoration(
          border: Border.all(
            color: HexColor(AppColors.lightGray)
          ),
          borderRadius: BorderRadius.circular(10),
          // For shimmer, use a solid color that approximates your gradient.
          // The gradient itself can interfere with the shimmer effect.
          // color: HexColor('#103A17'), // A dark, solid green
        ),
        child: Stack(
          children: [
            // 1. Settings Icon Placeholder (Top Right)
            Positioned(
              top: 0,
              right: 0,
              child: Container( // This container itself doesn't shimmer, its child does if needed
                height: 40,
                width: 40,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: Colors.white, // Actual color from your design
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                  ),
                ),
                // Child placeholder for the icon inside the white box
                child: _buildPlaceholder(height: 20, width: 20, color: Colors.black),
              ),
            ),

            // 2. Main Content Block Placeholder (Positioned from top-left)
            Positioned(
              top: 12,
              left: 8,
              // width is important here to constrain the Column
              // Subtract left padding (8) and some right padding (e.g., 8)
              child: SizedBox(
                width: size.width - 16 - 8, // size.width - leftMargin - leftPadding - rightPadding
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  // Using fixed SizedBoxes for spacing to match your 'Spaces' more easily
                  children: [
                    // 2.1. First Row (Icon + Account Details)
                    Row(
                      children: [
                        // 2.1.1. Wallet Icon Placeholder
                        _buildPlaceholder(
                          height: 50,
                          width: 50,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        const SizedBox(width: smallSpace), // was Spaces.smallSideSpace
                        // 2.1.2. Account Number Text Block
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 'Account Number' title placeholder
                            _buildPlaceholder(height: 12, width: 110),
                            const SizedBox(height: tinySpace),
                            // Account Number Value + Copy Icon placeholder Row
                            Row(
                              children: [
                                // Actual account number placeholder
                                _buildPlaceholder(height: 16, width: 150),
                                const SizedBox(width: tinySpace), // was Spaces.tinySideSpace
                                // Copy icon placeholder
                                _buildPlaceholder(
                                  height: 30,
                                  width: 30,
                                  shape: BoxShape.circle,
                                ),
                              ],
                            )
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: smallSpace + 2), // was Spaces.smallTopSpace, adjusted a bit
                    // 2.2. 'Total Balance' Title Placeholder
                    _buildPlaceholder(height: 12, width: 90),
                    const SizedBox(height: smallSpace), // was Spaces.smallTopSpace
                    // 2.3. Second Row (Balance Amount + Eye Icon + Rise Image)
                    Row(
                      children: [
                        // Balance amount placeholder
                        _buildPlaceholder(height: 22, width: 130), // Slightly taller for largeGrotesk
                        const SizedBox(width: tinySpace), // was Spaces.tinySideSpace
                        // Eye icon placeholder
                        _buildPlaceholder(
                          height: 30,
                          width: 30,
                          shape: BoxShape.circle,
                        ),
                        const SizedBox(width: smallSpace), // was Spaces.smallSideSpace
                        // Rise image placeholder
                        _buildPlaceholder(width: 60, height: 35),
                      ],
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

