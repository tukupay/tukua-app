import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../models/models.dart';

/// A horizontal carousel of featured merchants
class FeaturedMerchantsCarousel extends StatelessWidget {
  final List<MerchantApp> merchants;
  final Function(MerchantApp) onMerchantTap;

  const FeaturedMerchantsCarousel({
    super.key,
    required this.merchants,
    required this.onMerchantTap,
  });

  // Color pairs for featured cards using green theme
  static List<List<Color>> get _colorPairs => [
    [HexColor(AppColors.lightFadedGreen), HexColor(AppColors.primaryGreen)], // Primary green
    [const Color(0xFFE3F2FD), const Color(0xFF2196F3)], // Blue theme
    [HexColor(AppColors.lightFadedGreen).withValues(alpha: 0.7), HexColor(AppColors.fadedGreen)], // Faded green
    [const Color(0xFFF3E5F5), const Color(0xFF9C27B0)], // Purple theme
    [Color(int.parse('FF${AppColors.fadedOrange}', radix: 16)), HexColor(AppColors.primaryOrange)], // Orange theme
  ];

  @override
  Widget build(BuildContext context) {
    if (merchants.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: merchants.length,
        itemBuilder: (context, index) {
          final merchant = merchants[index];
          final colors = _colorPairs[index % _colorPairs.length];

          return GestureDetector(
            onTap: () => onMerchantTap(merchant),
            child: _FeaturedCard(
              merchant: merchant,
              backgroundColor: colors[0],
              accentColor: colors[1],
            ),
          );
        },
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final MerchantApp merchant;
  final Color backgroundColor;
  final Color accentColor;

  const _FeaturedCard({
    required this.merchant,
    required this.backgroundColor,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 14),
      decoration: GlassMorphism.standard(),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          // Decorative elements - clipped within container
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              height: 100,
              width: 100,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 40,
            top: 30,
            child: Container(
              height: 60,
              width: 60,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top area - Main visual
              Expanded(
                flex: 3,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: merchant.iconAsset != null
                        ? Image.asset(
                            Strings.iconImage(merchant.iconAsset!),
                            height: 50,
                            width: 50,
                            fit: BoxFit.cover,
                          )
                        : Icon(
                            HugeIcons.strokeRoundedStore04,
                            size: 50,
                            color: accentColor,
                          ),
                  ),
                ),
              ),
              // Bottom area - Info
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      height: 36,
                      width: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
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
                              size: 18,
                              color: accentColor,
                            ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            merchant.name,
                            style: Blacks.tinyBoldPoppins.copyWith(
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            merchant.description,
                            style: Grays.tinySemiKarla.copyWith(
                              fontSize: 11,
                              color: HexColor('#666666'),
                            ),
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
        ],
      ),
    );
  }
}



