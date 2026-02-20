import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../constants/constants.dart';
class TransactionsShimmer extends StatelessWidget {
  const TransactionsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      itemBuilder: (context,index) {
        return Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Container(
              height: 55,
                margin: Paddings.tinyAllSides,
                padding: Paddings.tinyHorizontal,
                width: size.width,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Colors.grey[300]!, // Use shimmer base for border in skeleton
                  ),
                  borderRadius: BorderRadius.circular(8),
                  // color: Colors.white, // Background for shimmer effect, content will be shimmered
                ),
                child: Row(
                    children: [
                    Spaces.tinySideSpace,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center, // Center vertically
                        children: [
                          // Skeleton for Description
                          Container(
                            width: size.width * 0.5, // Approximate width of description
                            height: 14, // Approximate height based on Blacks.tinyBoldGrotesk
                            color: Colors.white, // This color will be shimmered over
                            margin: const EdgeInsets.only(bottom: 4.0), // Space between description and date
                          ),
                          // Skeleton for Date
                          Container(
                            width: size.width * 0.4, // Approximate width of date
                            height: 12, // Approximate height based on Grays.tinySemiGrotesk
                            color: Colors.white, // This color will be shimmered over
                          ),
                        ],
                      ),
                    ),
                    Spaces.tinySideSpace,
                      // Skeleton for Amount
                      Container(
                        width: size.width * 0.2, // Approximate width of amount
                        height: 16, // Approximate height based on Blacks.regularBoldGrotesk
                        color: Colors.white, // This color will be shimmered over
                      ),
                      Spaces.tinySideSpace, // Add a little space at the end if the original design has it implicitly
                    ],
                ),
            ),
        );
      }
    );
  }
}
