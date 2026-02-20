import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class FundraiserImagePickers extends StatelessWidget {
  const FundraiserImagePickers({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<FundraiserProvider>(
      builder: (_, fundraiserProvider, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Photo Section
            _buildCoverImagePicker(context, fundraiserProvider),
            const SizedBox(height: 14),

            // Additional Images Label
            Row(
              children: [
                Icon(
                  HugeIcons.strokeRoundedImageAdd02,
                  size: 14,
                  color: HexColor(AppColors.darkerGray2),
                ),
                const SizedBox(width: 6),
                Text(
                  'Additional Images (Optional)',
                  style: Grays.tinyPoppinsHint.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Additional Images Row
            Row(
              children: [
                Expanded(
                  child: _buildAdditionalImagePicker(
                    image: fundraiserProvider.otherOne,
                    onTap: () => fundraiserProvider.selectOtherOne(),
                    label: '1',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildAdditionalImagePicker(
                    image: fundraiserProvider.otherTwo,
                    onTap: () => fundraiserProvider.selectOtherTwo(),
                    label: '2',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildAdditionalImagePicker(
                    image: fundraiserProvider.otherThree,
                    onTap: () => fundraiserProvider.selectOtherThree(),
                    label: '3',
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildCoverImagePicker(
      BuildContext context, FundraiserProvider fundraiserProvider) {
    final hasCover = fundraiserProvider.coverImage != null;

    return GestureDetector(
      onTap: () => fundraiserProvider.selectCoverImage(),
      child: Container(
        height: 160,
        width: double.infinity,
        decoration: BoxDecoration(
          color: hasCover ? null : HexColor('#F8FAF9'),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasCover
                ? HexColor(AppColors.primaryGreen)
                : HexColor('#E0E4E3'),
            width: hasCover ? 2 : 1,
            style: hasCover ? BorderStyle.solid : BorderStyle.solid,
          ),
          image: hasCover
              ? DecorationImage(
                  image: FileImage(fundraiserProvider.coverImage!),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: hasCover
            ? _buildCoverOverlay()
            : _buildEmptyCoverPlaceholder(),
      ),
    );
  }

  Widget _buildCoverOverlay() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withAlpha(150),
          ],
        ),
      ),
      child: Align(
        alignment: Alignment.bottomRight,
        child: Container(
          margin: const EdgeInsets.all(10),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(230),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                HugeIcons.strokeRoundedEdit02,
                size: 14,
                color: HexColor(AppColors.primaryGreen),
              ),
              const SizedBox(width: 4),
              Text(
                'Change',
                style: TextStyle(
                  color: HexColor(AppColors.primaryGreen),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyCoverPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(20),
            shape: BoxShape.circle,
          ),
          child: Icon(
            HugeIcons.strokeRoundedCamera01,
            size: 28,
            color: HexColor(AppColors.primaryGreen),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Add Cover Photo',
          style: TextStyle(
            color: HexColor(AppColors.darkerGray2),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Recommended: 16:9 ratio',
          style: Grays.smallestPoppinsHint,
        ),
      ],
    );
  }

  Widget _buildAdditionalImagePicker({
    required File? image,
    required VoidCallback onTap,
    required String label,
  }) {
    final hasImage = image != null;

    return GestureDetector(
      onTap: onTap,
      child: AspectRatio(
        aspectRatio: 1,
        child: Container(
          decoration: BoxDecoration(
            color: hasImage ? null : HexColor('#F8FAF9'),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: hasImage
                  ? HexColor(AppColors.primaryGreen)
                  : HexColor('#E0E4E3'),
              width: hasImage ? 1.5 : 1,
            ),
            image: hasImage
                ? DecorationImage(
                    image: FileImage(image),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: hasImage
              ? _buildImageOverlay()
              : _buildEmptyImagePlaceholder(),
        ),
      ),
    );
  }

  Widget _buildImageOverlay() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: Colors.black.withAlpha(80),
      ),
      child: Center(
        child: Icon(
          HugeIcons.strokeRoundedEdit02,
          size: 18,
          color: Colors.white.withAlpha(230),
        ),
      ),
    );
  }

  Widget _buildEmptyImagePlaceholder() {
    return Center(
      child: Icon(
        HugeIcons.strokeRoundedImageAdd01,
        size: 22,
        color: HexColor(AppColors.primaryGreen).withAlpha(180),
      ),
    );
  }
}
