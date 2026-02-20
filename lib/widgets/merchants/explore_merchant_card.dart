import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';

/// Card showing an available merchant in the explore section
class ExploreMerchantCard extends StatelessWidget {
  final int index;
  final bool isInstalled;


  const ExploreMerchantCard({
    super.key,
    required this.index,
    this.isInstalled = false,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Sample merchant data
    final merchantName = _getMerchantName(index);
    final merchantDescription = _getMerchantDescription(index);
    final merchantCategory = _getMerchantCategory(index);

    return GestureDetector(
      onTap: (){
        Navigator.pushNamed(context, Routes.churchInfo);
      },
      child: Container(
        alignment: Alignment.center,
        margin: Paddings.tinyVertical,
        padding: Paddings.smallHorizontal,
        height: 72,
        width: size.width,
        decoration: BoxDecoration(
          color: index % 2 == 0 ? Colors.transparent : HexColor('F3FFF1'),
          border: Border.all(color: HexColor('9C9C9C')),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Merchant icon/logo
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    HexColor(AppColors.primaryGreen).withValues(alpha: 0.2),
                    HexColor(AppColors.primaryGreen).withValues(alpha: 0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getMerchantIcon(index),
                color: HexColor(AppColors.primaryGreen),
                size: 24,
              ),
            ),

            Spaces.smallSideSpace,

            // Merchant info
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(merchantName, style: Blacks.tinyBoldJakarta),
                  const SizedBox(height: 2),
                  Text(
                    merchantDescription,
                    style: Grays.tinySemiKarla,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  // Category badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      merchantCategory,
                      style: TextStyle(
                        color: HexColor(AppColors.primaryGreen),
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Spaces.smallSideSpace,

            // Install button or Installed badge
            isInstalled
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle,
                          color: HexColor(AppColors.primaryGreen),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Installed',
                          style: TextStyle(
                            color: HexColor(AppColors.primaryGreen),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Roboto',
                          ),
                        ),
                      ],
                    ),
                  )
                : GestureDetector(
                    onTap: () {
                      Fluttertoast.cancel();
                      Fluttertoast.showToast(
                        msg: "to install $merchantName",
                        toastLength: Toast.LENGTH_SHORT,
                        gravity: ToastGravity.BOTTOM,
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.download,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Install',
                            style: Whites.regularSemiRoboto.copyWith(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  // Helper methods for sample data
  String _getMerchantName(int index) {
    final names = [
      'JCC Thika Road',
      'Mkulima',
      'Cladi',
      'Health Plus',
      'Edu Connect',
      'Travel Buddy',
      'Food Order',
      'Fitness Track',
    ];
    return names[index % names.length];
  }

  String _getMerchantDescription(int index) {
    final descriptions = [
      'Our church is located along Thika Road',
      'Digital farming supplements supplier',
      'Online shopping platform',
      'Healthcare services',
      'Education services provider',
      'Travel booking agency',
      'Food delivery service',
      'Fitness tracker & gym management',
    ];
    return descriptions[index % descriptions.length];
  }

  String _getMerchantCategory(int index) {
    final categories = [
      'Faith',
      'Agriculture',
      'Shopping',
      'Health',
      'Education',
      'Travel',
      'Food',
      'Lifestyle',
    ];
    return categories[index % categories.length];
  }

  IconData _getMerchantIcon(int index) {
    final icons = [
      HugeIcons.strokeRoundedChurch,
      HugeIcons.strokeRoundedPlant01,
      HugeIcons.strokeRoundedShoppingCart01,
      HugeIcons.strokeRoundedHealtcare,
      HugeIcons.strokeRoundedMortarboard01,
      HugeIcons.strokeRoundedPlane,
      HugeIcons.strokeRoundedRestaurant01,
      HugeIcons.strokeRoundedRunningShoes,
    ];
    return icons[index % icons.length];
  }
}

