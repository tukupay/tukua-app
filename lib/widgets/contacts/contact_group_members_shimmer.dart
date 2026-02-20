import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
// Import your constants if needed for Paddings, Spaces, etc.
// import '../../constants/constants.dart';


class ContactGroupMemberShimmer extends StatelessWidget {
  const ContactGroupMemberShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    // Define shimmer gradient colors
    // These are common choices, feel free to adjust them
    final shimmerBaseColor = Colors.grey[300]!;
    final shimmerHighlightColor = Colors.grey[100]!;

    return Shimmer.fromColors(
      baseColor: shimmerBaseColor,
      highlightColor: shimmerHighlightColor,
      child: Container(
        // Use the same margin as your original widget for consistency
        margin: const EdgeInsets.symmetric(vertical: 8), // Assuming Paddings.smallestVertical is around 4.0
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center, // Align items nicely
          children: [
            // 1. Shimmer for the number Text ('1. ')
            Container(
              width: 25, // Approximate width of '1. '
              height: 16, // Approximate height of the text
              decoration: BoxDecoration(
                color: Colors.white, // This will be overridden by shimmer
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            // Assuming Spaces.smallSideSpace is around 8.0
            const SizedBox(width: 8.0),

            // 2. Shimmer for the circular avatar
            Container(
              height: 45,
              width: 45,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white, // This will be overridden by shimmer
              ),
            ),
            const SizedBox(width: 8.0), // Assuming Spaces.smallSideSpace

            // 3. Shimmer for the Column of text (name, phone, email)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center, // Center vertically
                children: [
                  // Shimmer for Name
                  Container(
                    width: double.infinity, // Take full available width in Expanded
                    height: 16, // Approximate height of the name text
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6), // Spacing between text lines
                  // Shimmer for Phone
                  Container(
                    width: MediaQuery.of(context).size.width * 0.4, // Approx 40% of screen width
                    height: 12, // Approximate height of the phone text
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Shimmer for Email
                  Container(
                    width: MediaQuery.of(context).size.width * 0.5, // Approx 50% of screen width
                    height: 10, // Approximate height of the email text
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            // No specific shimmer for the Row of IconButtons is usually needed
            // as they are interactive elements. If you want to shimmer them,
            // you can add small circular or rectangular shimmer placeholders.
            // For simplicity, I'm omitting them as the primary content is what
            // usually gets shimmered. If you want to include them:

            // const SizedBox(width: 8.0), // Space before icons
            // Row(
            //   children: [
            //     Container(
            //       width: 24,
            //       height: 24,
            //       decoration: BoxDecoration(
            //         color: Colors.white,
            //         borderRadius: BorderRadius.circular(4),
            //       ),
            //     ),
            //     const SizedBox(width: 8),
            //     Container(
            //       width: 24,
            //       height: 24,
            //       decoration: BoxDecoration(
            //         color: Colors.white,
            //         borderRadius: BorderRadius.circular(4),
            //       ),
            //     ),
            //   ],
            // )
          ],
        ),
      ),
    );
  }
}
