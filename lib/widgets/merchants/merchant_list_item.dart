import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import '../../models/models.dart';

/// List item card for merchants in the Discover section
class MerchantListItem extends StatelessWidget {
  final MerchantApp merchant;
  final bool isInstalled;
  final VoidCallback onTap;
  final VoidCallback onInstallToggle;
  final bool showNewBadge;

  const MerchantListItem({
    super.key,
    required this.merchant,
    required this.isInstalled,
    required this.onTap,
    required this.onInstallToggle,
    this.showNewBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Merchant icon with optional new badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 56,
                  width: 56,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        _getCategoryColor(merchant.category).withValues(alpha: 0.15),
                        _getCategoryColor(merchant.category).withValues(alpha: 0.05),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: merchant.iconAsset != null
                      ? Padding(
                          padding: const EdgeInsets.all(10),
                          child: Image.asset(
                            Strings.iconImage(merchant.iconAsset!),
                            fit: BoxFit.cover,
                          ),
                        )
                      : Icon(
                          _getCategoryIcon(merchant.category),
                          color: _getCategoryColor(merchant.category),
                          size: 28,
                        ),
                ),
                // New badge
                if (merchant.isNew || showNewBadge)
                  Positioned(
                    bottom: -4,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryOrange),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'New',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            // Merchant info
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
                  const SizedBox(height: 4),
                  Text(
                    merchant.description,
                    style: Grays.tinySemiKarla.copyWith(
                      color: HexColor('#8E8E93'),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Install/Installed indicator
            GestureDetector(
              onTap: () {
                onInstallToggle();
                Fluttertoast.cancel();
                Fluttertoast.showToast(
                  msg: isInstalled
                      ? '${merchant.name} uninstalled'
                      : '${merchant.name} installed',
                  toastLength: Toast.LENGTH_SHORT,
                );
              },
              child: Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  color: isInstalled
                      ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.1)
                      : HexColor(AppColors.fadedGreen).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isInstalled
                      ? Icons.check_circle_rounded
                      : Icons.download_rounded,
                  color: isInstalled
                      ? HexColor(AppColors.primaryGreen)
                      : HexColor(AppColors.fadedGreen),
                  size: 22,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'faith':
        return HexColor(AppColors.primaryGreen);
      case 'finance':
        return HexColor('#007AFF');
      case 'shopping':
        return HexColor('#FF9500');
      case 'education':
        return HexColor('#5856D6');
      case 'health':
        return HexColor('#FF2D55');
      case 'lifestyle':
        return HexColor('#34C759');
      default:
        return HexColor(AppColors.primaryGreen);
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'faith':
        return HugeIcons.strokeRoundedChurch;
      case 'finance':
        return HugeIcons.strokeRoundedBank;
      case 'shopping':
        return HugeIcons.strokeRoundedShoppingCart01;
      case 'education':
        return HugeIcons.strokeRoundedMortarboard01;
      case 'health':
        return HugeIcons.strokeRoundedHealtcare;
      case 'lifestyle':
        return HugeIcons.strokeRoundedRunningShoes;
      default:
        return HugeIcons.strokeRoundedStore04;
    }
  }
}


