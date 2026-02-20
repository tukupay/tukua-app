import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../models/models.dart';

/// A horizontal carousel of installed merchants with quick menu toggle
class InstalledMerchantsCarousel extends StatelessWidget {
  final List<MerchantApp> merchants;
  final List<String> quickMenuIds;
  final Function(MerchantApp) onMerchantTap;
  final Function(String) onQuickMenuToggle;

  const InstalledMerchantsCarousel({
    super.key,
    required this.merchants,
    required this.quickMenuIds,
    required this.onMerchantTap,
    required this.onQuickMenuToggle,
  });

  bool _isInQuickMenu(String merchantId) {
    return quickMenuIds.contains(merchantId);
  }

  @override
  Widget build(BuildContext context) {
    if (merchants.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 175,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
        itemCount: merchants.length,
        itemBuilder: (context, index) {
          final merchant = merchants[index];
          final isInQuickMenu = _isInQuickMenu(merchant.id);
          return _MerchantCard(
            merchant: merchant,
            isInQuickMenu: isInQuickMenu,
            onTap: () => onMerchantTap(merchant),
            onQuickMenuToggle: () => onQuickMenuToggle(merchant.id),
          );
        },
      ),
    );
  }
}

class _MerchantCard extends StatelessWidget {
  final MerchantApp merchant;
  final bool isInQuickMenu;
  final VoidCallback onTap;
  final VoidCallback onQuickMenuToggle;

  const _MerchantCard({
    required this.merchant,
    required this.isInQuickMenu,
    required this.onTap,
    required this.onQuickMenuToggle,
  });

  // Generate gradient colors for the card based on merchant category
  List<Color> _getGradientColors() {
    switch (merchant.category.toLowerCase()) {
      case 'religious':
        return [HexColor('#1B3A4B'), HexColor('#0D1B2A')];
      case 'education':
        return [HexColor('#2D5016'), HexColor('#1A3009')];
      case 'health':
        return [HexColor('#4A1942'), HexColor('#2D1028')];
      case 'finance':
        return [HexColor('#0D4B3A'), HexColor('#062D23')];
      default:
        return [HexColor(AppColors.primaryGreen), HexColor('#0A2E1A')];
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final gradientColors = _getGradientColors();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size.width * 0.75,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Decorative glassmorphic circle top right
              Positioned(
                top: -30,
                right: -30,
                child: Container(
                  height: 120,
                  width: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.15),
                        Colors.white.withValues(alpha: 0.05),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              // Decorative glassmorphic circle bottom left
              Positioned(
                bottom: -50,
                left: -20,
                child: Container(
                  height: 140,
                  width: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.08),
                        Colors.white.withValues(alpha: 0.02),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
              // Subtle gradient overlay
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: 0.1),
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.1),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              ),
              // Main content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top row: Logo + Star button
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Glassmorphic logo container
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                            child: Container(
                              height: 52,
                              width: 52,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.3),
                                  width: 1,
                                ),
                              ),
                              padding: const EdgeInsets.all(8),
                              child: merchant.iconAsset != null
                                  ? Image.asset(
                                      Strings.iconImage(merchant.iconAsset!),
                                      fit: BoxFit.contain,
                                    )
                                  : Icon(
                                      HugeIcons.strokeRoundedStore04,
                                      size: 28,
                                      color: Colors.white,
                                    ),
                            ),
                          ),
                        ),
                        const Spacer(),
                        // Quick menu star button
                        GestureDetector(
                          onTap: onQuickMenuToggle,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                              child: Container(
                                height: 36,
                                width: 36,
                                decoration: BoxDecoration(
                                  gradient: isInQuickMenu
                                      ? LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            HexColor(AppColors.primaryOrange),
                                            HexColor(AppColors.primaryOrange).withValues(alpha: 0.85),
                                          ],
                                        )
                                      : null,
                                  color: isInQuickMenu ? null : Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isInQuickMenu
                                        ? Colors.transparent
                                        : Colors.white.withValues(alpha: 0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Icon(
                                  isInQuickMenu ? Icons.star_rounded : Icons.star_outline_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    // Merchant name
                    Text(
                      merchant.name,
                      style: Whites.regularSemiRoboto.copyWith(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                        letterSpacing: -0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    // Category tag
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedTag01,
                            size: 12,
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            merchant.category,
                            style: Whites.smallSemiKarla.copyWith(
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
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
      ),
    );
  }
}


