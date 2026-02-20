import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
import 'fundraiser_image_viewer.dart';

/// Button to open the full-screen image viewer
class ViewAllImagesButton extends StatelessWidget {
  final List<String> imageUrls;

  const ViewAllImagesButton({
    super.key,
    required this.imageUrls,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrls.isEmpty) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FundraiserImageViewer(
              imageUrls: imageUrls,
              initialIndex: 0,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen).withAlpha(30),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: HexColor(AppColors.primaryGreen),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              HugeIcons.strokeRoundedImage02,
              size: 18,
              color: HexColor(AppColors.primaryGreen),
            ),
            Spaces.tinySideSpace,
            Text(
              'View All Images (${imageUrls.length})',
              style: TextStyle(
                color: HexColor(AppColors.primaryGreen),
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Inter',
              ),
            ),
            Spaces.tinySideSpace,
            Icon(
              Icons.arrow_forward_ios,
              size: 12,
              color: HexColor(AppColors.primaryGreen),
            ),
          ],
        ),
      ),
    );
  }
}

