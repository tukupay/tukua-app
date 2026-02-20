import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../models/models.dart';

/// Featured merchant hero card with banner image
class FeaturedMerchantCard extends StatelessWidget {
  final MerchantApp merchant;
  final VoidCallback onTap;
  final Color backgroundColor;
  final Color accentColor;

  const FeaturedMerchantCard({
    super.key,
    required this.merchant,
    required this.onTap,
    this.backgroundColor = const Color(0xFFE8F5E9),
    this.accentColor = const Color(0xFF15411D),
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 280,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner area with decorative elements
            Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    backgroundColor,
                    backgroundColor.withValues(alpha: 0.7),
                  ],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Stack(
                children: [
                  // Decorative circles
                  Positioned(
                    right: 20,
                    top: 20,
                    child: Container(
                      height: 80,
                      width: 80,
                      decoration: BoxDecoration(
                        color: accentColor.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  // Main icon/image
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: merchant.iconAsset != null
                          ? Image.asset(
                              Strings.iconImage(merchant.iconAsset!),
                              height: 48,
                              width: 48,
                              fit: BoxFit.cover,
                            )
                          : Icon(
                              HugeIcons.strokeRoundedStore04,
                              size: 48,
                              color: accentColor,
                            ),
                    ),
                  ),
                ],
              ),
            ),
            // Merchant info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: merchant.iconAsset != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.asset(
                              Strings.iconImage(merchant.iconAsset!),
                              fit: BoxFit.cover,
                            ),
                          )
                        : Icon(
                            HugeIcons.strokeRoundedStore04,
                            size: 20,
                            color: accentColor,
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          merchant.name,
                          style: Blacks.tinyBoldPoppins,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          merchant.description,
                          style: Grays.tinySemiKarla,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}



