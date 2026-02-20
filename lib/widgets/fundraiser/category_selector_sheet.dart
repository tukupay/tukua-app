import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

/// Bottom sheet for selecting fundraiser category
class CategorySelectorSheet extends StatelessWidget {
  final List<String> categories;
  final String? selectedCategory;
  final ValueChanged<String> onSelected;

  const CategorySelectorSheet({
    super.key,
    required this.categories,
    required this.selectedCategory,
    required this.onSelected,
  });

  IconData _getCategoryIcon(String category) {
    final lower = category.toLowerCase();
    if (lower.contains('medical') || lower.contains('health')) {
      return HugeIcons.strokeRoundedMedicalMask;
    } else if (lower.contains('education') || lower.contains('school')) {
      return HugeIcons.strokeRoundedMortarboard02;
    } else if (lower.contains('emergency')) {
      return HugeIcons.strokeRoundedAlert02;
    } else if (lower.contains('church') || lower.contains('religious')) {
      return HugeIcons.strokeRoundedChurch;
    } else if (lower.contains('business')) {
      return HugeIcons.strokeRoundedStore01;
    } else if (lower.contains('community')) {
      return HugeIcons.strokeRoundedUserGroup;
    } else if (lower.contains('charity')) {
      return HugeIcons.strokeRoundedGivePill;
    } else {
      return HugeIcons.strokeRoundedFolder01;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: HexColor('#E0E0E0'),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor('#FFF3E0'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedFolder01,
                  color: HexColor('#FB8C00'),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Select Category', style: Blacks.regularBoldCodeNext),
                    const SizedBox(height: 2),
                    Text(
                      'Choose what best describes your fundraiser',
                      style: Grays.tinyPoppinsHint,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Categories grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.5,
            ),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              final isSelected = selectedCategory == category;
              return GestureDetector(
                onTap: () {
                  onSelected(category);
                  Navigator.pop(context);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? HexColor(AppColors.primaryGreen).withAlpha(25)
                        : HexColor('#F8FAF9'),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? HexColor(AppColors.primaryGreen)
                          : HexColor('#E8ECE9'),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _getCategoryIcon(category),
                        size: 18,
                        color: isSelected
                            ? HexColor(AppColors.primaryGreen)
                            : HexColor(AppColors.darkerGray2),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          category,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected
                                ? HexColor(AppColors.primaryGreen)
                                : HexColor(AppColors.darkerGray2),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isSelected)
                        Icon(
                          HugeIcons.strokeRoundedCheckmarkCircle01,
                          color: HexColor(AppColors.primaryGreen),
                          size: 16,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
        ],
      ),
    );
  }
}

