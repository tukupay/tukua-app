import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:tuku/constants/constants.dart';

class LoadingFavourites extends StatelessWidget {
  const LoadingFavourites({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SizedBox(
        height: 80, // Matches the height of the FavouritesSection
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 5, // Display 5 shimmer items
          itemBuilder: (context, index) {
            return Container(
              margin: Paddings.tinyHorizontal,
              width: 60,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Skeleton for the circular avatar
                  Container(
                    height: 50,
                    width: 50,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                  Spaces.tinyTopSpace,
                  // Skeleton for the name text
                  Container(
                    height: 8,
                    width: 40,
                    color: Colors.white,
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
